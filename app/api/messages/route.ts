import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/client-ip';
import { prisma } from '@/lib/prisma';

const COOLDOWN_SECONDS = 30 * 60;

export async function GET() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
    const serializedMessages = messages.map(msg => ({
      ...msg,
      timestamp: Number(msg.timestamp),
    }));
    return NextResponse.json({ messages: serializedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === 'string' ? body.content.trim() : '';
  const anonymous = body?.anonymous === true;
  const nickname = anonymous ? undefined : body?.author;
  const author = typeof nickname === 'string' ? nickname.trim() : '';

  if (!content || content.length > 200) {
    return NextResponse.json({ error: 'Enter a message between 1 and 200 characters.' }, { status: 400 });
  }
  if ((nickname !== undefined && typeof nickname !== 'string') || author.length > 20) {
    return NextResponse.json({ error: 'Use a nickname of up to 20 characters.' }, { status: 400 });
  }
  const submittedWebsite = anonymous ? null : body.website;
  const website = typeof submittedWebsite === 'string' ? submittedWebsite.trim() : '';
  const url = website.length <= 2048 && URL.canParse(website) ? new URL(website) : null;
  if ((submittedWebsite != null && typeof submittedWebsite !== 'string') ||
      (website && (!url || !/^https?:\/\//i.test(website) || url.username || url.password || url.href.length > 2048))) {
    return NextResponse.json({ error: 'Enter a valid http:// or https:// website.' }, { status: 400 });
  }

  try {
    const ip = getClientIp(request) ?? 'unknown';
    const now = Date.now();
    const cutoff = now - COOLDOWN_SECONDS * 1000;
    const result = await prisma.$transaction(async (tx) => {
      const claimed = await tx.$executeRaw`
        INSERT INTO "PostCooldown" ("ip", "lastPostTime") VALUES (${ip}, ${now})
        ON CONFLICT ("ip") DO UPDATE SET "lastPostTime" = excluded."lastPostTime"
        WHERE "PostCooldown"."lastPostTime" <= ${cutoff}
      `;
      if (!claimed) {
        const cooldown = await tx.postCooldown.findUniqueOrThrow({ where: { ip } });
        const remaining = COOLDOWN_SECONDS - (Date.now() - Number(cooldown.lastPostTime)) / 1000;
        return { retryAfter: Math.max(1, Math.ceil(remaining)) };
      }
      const message = await tx.message.create({
        data: { id: randomUUID(), author: author || 'Anonymous', content, timestamp: now, website: url?.href ?? null },
      });
      return { message };
    });

    if (!result.message) {
      return NextResponse.json(
        { error: 'Please wait before posting again.' },
        { status: 429, headers: { 'Retry-After': String(result.retryAfter) } }
      );
    }
    return NextResponse.json({
      success: true,
      cooldownSeconds: COOLDOWN_SECONDS,
      message: { ...result.message, timestamp: Number(result.message.timestamp) },
    });
  } catch (error) {
    console.error('Error posting message:', error);
    return NextResponse.json({ error: 'Failed to post message' }, { status: 500 });
  }
}
