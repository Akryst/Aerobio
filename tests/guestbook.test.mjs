import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';

test('guestbook rejects unauthorized deletes and deduplicates concurrent writes', { timeout: 20_000 }, async () => {
  const directory = mkdtempSync(join(tmpdir(), 'aerobio-test-'));
  const filename = join(directory, 'guestbook.db');
  const secret = 'test-only-moderation-key';
  const env = {
    ...process.env,
    DATABASE_URL: `file:${filename.replaceAll('\\', '/')}`,
    TRUSTED_IP_HEADER: 'x-real-ip',
    ADMIN_SECRET: secret,
  };

  let server;
  try {
    const db = new DatabaseSync(filename);
    try {
      db.exec(`
        CREATE TABLE Message (
          id TEXT NOT NULL PRIMARY KEY,
          author TEXT NOT NULL,
          content TEXT NOT NULL,
          timestamp BIGINT NOT NULL,
          likes INTEGER NOT NULL DEFAULT 0
        );
        INSERT INTO Message VALUES ('legacy', 'Anonymous', 'Old signature', 1600000000000, 4);
      `);
    } finally {
      db.close();
    }
    execFileSync(process.execPath, [
      'node_modules/prisma/build/index.js', 'db', 'push', '--skip-generate',
    ], { env });

    server = spawn(process.execPath, [
      'node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '0',
    ], { env, stdio: ['ignore', 'pipe', 'inherit'] });
    let output = '';
    server.stdout.on('data', (chunk) => { output += chunk; });
    for (let attempt = 0; !output.includes('Ready in') && server.exitCode === null && attempt < 80; attempt++) {
      await delay(100);
    }
    const origin = output.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
    assert.ok(origin && output.includes('Ready in'), `Next did not start. Run npm run build first.\n${output}`);

    const post = (path, body, headers = {}) => fetch(origin + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Real-IP': '198.51.100.4', ...headers },
      body: JSON.stringify(body),
    });

    const blank = await post('/api/messages', { content: '   ' });
    assert.equal(blank.status, 400);

    const invalidWebsite = await post('/api/messages', { content: 'Test', website: 'javascript:alert(1)' });
    assert.equal(invalidWebsite.status, 400);
    const website = 'https://example.com/';
    const posts = await Promise.all([
      post('/api/messages', { content: 'First signature', website }, { 'X-Forwarded-For': '198.51.100.5' }),
      post('/api/messages', { content: 'Second signature', website }, { 'X-Forwarded-For': '198.51.100.6' }),
    ]);
    assert.deepEqual(posts.map((response) => response.status).sort(), [200, 429]);
    const retryAfter = Number(posts.find((response) => response.status === 429).headers.get('Retry-After'));
    assert.ok(retryAfter > 0 && retryAfter <= 1800);

    const anonymous = await post('/api/messages', {
      anonymous: true, author: 'Private nickname', content: 'Anonymous signature', website,
    }, { 'X-Real-IP': '198.51.100.7' });
    assert.equal(anonymous.status, 200);

    const votes = await Promise.all([
      post('/api/messages/like', { messageId: 'legacy' }),
      post('/api/messages/like', { messageId: 'legacy' }),
    ]);
    assert.deepEqual(await Promise.all(votes.map(async (response) => [response.status, (await response.json()).likes])),
      [[200, 5], [200, 5]]);

    const url = origin + '/api/messages/legacy';
    const unauthorized = await fetch(`${url}?secret=${secret}`, { method: 'DELETE' });
    assert.equal(unauthorized.status, 401);
    const authorized = await fetch(url, { method: 'DELETE', headers: { Authorization: `Bearer ${secret}` } });
    assert.equal(authorized.status, 200);

    const remaining = await fetch(origin + '/api/messages');
    const { messages } = await remaining.json();
    assert.equal(messages.length, 2);
    const anonymousMessage = messages.find((message) => message.content === 'Anonymous signature');
    assert.equal(anonymousMessage.author, 'Anonymous');
    assert.equal(anonymousMessage.website, null);
    assert.equal(messages.find((message) => message !== anonymousMessage).website, website);
  } finally {
    if (server && server.exitCode === null && server.signalCode === null) {
      const exited = once(server, 'exit');
      server.kill();
      await exited;
    }
    for (const suffix of ['', '-journal', '-shm', '-wal']) rmSync(filename + suffix, { force: true });
    rmdirSync(directory);
  }
});
