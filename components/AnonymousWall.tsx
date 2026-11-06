'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import WindowTitle from './WindowTitle';

interface Message {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  likes: number;
}

export default function AnonymousWall({ moderation = false }: { moderation?: boolean }) {
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);
  const [deadline, setDeadline] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadMessages = useCallback(() => {
    return fetch('/api/messages')
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => setMessages(data.messages))
      .catch(() => setLoadError(true));
  }, []);

  useEffect(() => {
    // Remove credentials saved by older versions of the guestbook.
    try {
      localStorage.removeItem('adminSecret');
    } catch {
      // The guestbook can run without browser storage.
    }
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (!seconds) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  function startCooldown(seconds: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setRemaining(seconds);
    setDeadline(Date.now() + seconds * 1000);
  }

  async function postMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || remaining || posting) return;
    const form = event.currentTarget;
    const nickname = new FormData(form).get('nickname');
    setPosting(true);
    setNotice(null);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: anonymous ? '' : nickname ?? '', content: message }),
      });
      const data = await response.json();
      if (response.status === 429) startCooldown(Number(response.headers.get('Retry-After')));
      if (!response.ok) throw new Error(data.error ?? 'Could not post your message.');

      startCooldown(data.cooldownSeconds);
      setMessages((current) => [data.message, ...(current ?? [])].slice(0, 100));
      setLoadError(false);
      setMessage('');
      setShowForm(false);
      setNotice({ text: 'Your message was posted.' });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Could not post your message.', error: true });
    } finally {
      setPosting(false);
    }
  }

  async function likeMessage(id: string) {
    if (liked.has(id) || pending) return;
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch('/api/messages/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: id }),
      });
      if (!response.ok) throw new Error();
      const { likes } = await response.json();
      setMessages((current) => current?.map((item) => item.id === id ? { ...item, likes } : item) ?? null);
      setLiked((current) => new Set([...current, id]));
    } catch {
      setNotice({ text: 'Could not save your like. Try again.', error: true });
    } finally {
      setPending(false);
    }
  }

  async function deleteMessage(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const secret = String(new FormData(form).get('secret') ?? '').trim();
    form.reset();
    setPending(true);
    setNotice(null);
    try {
      const response = await fetch(`/api/messages/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (response.status === 401) throw new Error('Moderation key rejected.');
      if (!response.ok && response.status !== 404) throw new Error('Could not delete the message.');
      setMessages((current) => current?.filter((item) => item.id !== id) ?? null);
      setDeleteId(null);
      setNotice({ text: 'Message removed.' });
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : 'Could not delete the message.', error: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="guestbook" aria-labelledby="guestbook-title" className="window active glass">
      <WindowTitle id="guestbook-title" icon="guestbook">
        {moderation ? 'Guestbook moderation' : 'Guestbook'}
      </WindowTitle>
      <div className="window-body space-y-3 !p-2">
        {!moderation && (
          <button type="button" aria-expanded={showForm} disabled={messages === null || loadError}
            onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Sign the guestbook'}
          </button>
        )}

        {notice && (
          <p role={notice.error ? 'alert' : 'status'} className={notice.error ? 'text-red-800' : 'text-green-800'}>
            {notice.text}
          </p>
        )}
        {remaining > 0 && (
          <p className="border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-900">
            Next post in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
          </p>
        )}

        {showForm && (
          <form onSubmit={postMessage} className="space-y-2 border border-slate-200 bg-slate-50 p-3">
            <div className="field-row">
              <input type="checkbox" id="anonymous-check" checked={anonymous}
                onChange={(event) => setAnonymous(event.target.checked)} />
              <label htmlFor="anonymous-check">Post anonymously</label>
            </div>
            {!anonymous && (
              <label className="block">
                Nickname <span className="text-slate-600">(optional)</span>
                <input name="nickname" type="text" maxLength={20} className="mt-1 block w-full" />
              </label>
            )}
            <label className="block">
              Message
              <textarea value={message} onChange={(event) => setMessage(event.target.value)}
                maxLength={200} rows={3} className="mt-1 block w-full resize-y" required />
            </label>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{message.length}/200</span>
              <button type="submit" disabled={posting || remaining > 0 || !message.trim()}>
                {posting ? 'Posting…' : 'Post message'}
              </button>
            </div>
          </form>
        )}

        {loadError ? (
          <div className="space-y-2 p-3 text-center">
            <p role="status">The guestbook couldn&apos;t load.</p>
            <button type="button" onClick={() => {
              setLoadError(false);
              void loadMessages();
            }}>Try again</button>
          </div>
        ) : messages === null ? (
          <p role="status" className="p-3 text-center text-slate-600">Opening the guestbook…</p>
        ) : messages.length === 0 ? (
          <p className="border border-dashed border-slate-300 p-4 text-center text-slate-700">
            {moderation ? 'No signatures yet.' : 'No signatures yet. Leave the first note.'}
          </p>
        ) : (
          <ol className="max-h-72 space-y-2 overflow-y-auto scrollbar-thin pr-1">
            {messages.map((item) => (
              <li key={item.id} className="border border-slate-200 bg-white p-3">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2">
                  <strong className="min-w-0 break-all text-blue-900">{item.author}</strong>
                  <time className="text-slate-600" dateTime={new Date(item.timestamp).toISOString()}>
                    {new Date(item.timestamp).toLocaleDateString()}
                  </time>
                </div>
                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{item.content}</p>
                <div className="mt-2 flex gap-2">
                  {moderation ? (
                    <button type="button" disabled={pending} onClick={() => setDeleteId(item.id)}>Delete…</button>
                  ) : (
                    <button type="button" disabled={pending || liked.has(item.id)}
                      onClick={() => likeMessage(item.id)}
                      aria-label={`${liked.has(item.id) ? 'Liked' : 'Like message'} · ${item.likes} likes`}>
                      {liked.has(item.id) ? '♥' : '♡'} {item.likes}
                    </button>
                  )}
                </div>
                {deleteId === item.id && (
                  <form onSubmit={(event) => deleteMessage(event, item.id)}
                    className="mt-2 space-y-2 border border-red-200 bg-red-50 p-2">
                    <label className="block">
                      Moderation key
                      <input name="secret" type="password" autoComplete="off" required className="mt-1 block w-full" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="submit" disabled={pending}>Confirm delete</button>
                      <button type="button" disabled={pending} onClick={() => setDeleteId(null)}>Cancel</button>
                    </div>
                  </form>
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="status-bar">
        <p className="status-bar-field">
          {messages ? `${messages.length} ${messages.length === 1 ? 'signature' : 'signatures'} shown` : 'Guestbook'}
        </p>
      </div>
    </section>
  );
}
