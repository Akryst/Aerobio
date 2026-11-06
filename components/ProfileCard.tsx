'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import type { LanyardData } from '@/types/lanyard';
import {
  getDiscordAvatarUrl,
  getAvatarDecorationUrl,
  getStatusColor,
  getStatusLabel,
  subscribeToLanyard,
} from '@/lib/lanyard';
import WindowTitle from './WindowTitle';

const socialLinks = [
  { label: 'GitHub', url: 'https://github.com/Akryst', icon: 'icon-[simple-icons--github]' },
  { label: 'X', url: 'https://x.com/Akryst_', icon: 'icon-[simple-icons--x]' },
  { label: 'Steam', url: 'https://steamcommunity.com/id/Anti-kryst', icon: 'icon-[simple-icons--steam]' },
];

export default function ProfileCard() {
  const [lanyard, setLanyard] = useState<LanyardData | null>(null);
  const [status, setStatus] = useState<'loading' | 'live' | 'unavailable' | 'unconfigured'>('loading');
  const [visitors, setVisitors] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState('');
  const [remoteBanner, setRemoteBanner] = useState<string | null>(null);
  const [brokenBanner, setBrokenBanner] = useState('');
  const [avatarResult, setAvatarResult] = useState<{ url: string; loaded: boolean } | null>(null);

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }));
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let unsubscribe: (() => void) | undefined;
    async function connect() {
      try {
        const response = await fetch('/api/lanyard', { signal: controller.signal });
        if (response.status === 503) {
          if (!controller.signal.aborted) setStatus('unconfigured');
          return;
        }
        if (!response.ok) throw new Error();
        const { discordId } = await response.json();
        if (typeof discordId !== 'string') throw new Error();
        if (!controller.signal.aborted) {
          setRemoteBanner(`https://dcdn.dstn.to/banners/${encodeURIComponent(discordId)}?size=1024`);
          unsubscribe = subscribeToLanyard(discordId, (presence) => {
            setLanyard(presence);
            setStatus('live');
          }, () => setStatus('unavailable'));
        }
      } catch {
        if (!controller.signal.aborted) setStatus('unavailable');
      }
    }
    void connect();
    return () => {
      controller.abort();
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/visitors', { signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data && !controller.signal.aborted) setVisitors(data.count);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const user = lanyard?.discord_user;
  const avatarUrl = user?.avatar ? getDiscordAvatarUrl(user.id, user.avatar, 256) : null;
  const avatarLoad = avatarResult?.url === avatarUrl ? avatarResult : null;
  const avatarLoading = status === 'loading' || Boolean(avatarUrl && !avatarLoad);
  const decorationUrl = user?.avatar_decoration_data
    ? getAvatarDecorationUrl(user.avatar_decoration_data.asset)
    : null;
  const banner = remoteBanner && remoteBanner !== brokenBanner ? remoteBanner : '/banner.png';
  const discordStatus = status === 'live' ? lanyard?.discord_status : undefined;
  const statusLabel = discordStatus ? getStatusLabel(discordStatus) : {
    loading: 'Connecting…',
    live: 'Unavailable',
    unavailable: 'Unavailable',
    unconfigured: 'Not configured',
  }[status];

  return (
    <section aria-labelledby="profile-title" className="window active glass">
      <WindowTitle id="profile-title" icon="profile">User Profile</WindowTitle>
      <div className="window-body !p-0">
        <div className="relative h-24 overflow-hidden border-b border-blue-200 bg-sky-100 sm:h-28">
          <Image src={banner} alt="" fill className="object-cover" unoptimized
            onError={() => setBrokenBanner(banner)} />
        </div>
        <div className="relative p-4">
          <div className="pointer-events-none absolute bottom-0 right-1 hidden opacity-90 min-[380px]:block lg:right-0">
            <Image src="/monika.png" alt="" width={112} height={146} className="object-contain" />
          </div>
          <div className="relative mb-2 flex flex-wrap items-end justify-between gap-2">
            <div className="relative -mt-12 grid h-20 w-20 shrink-0 place-items-center rounded-full border-4 border-white bg-blue-100 text-2xl font-semibold text-blue-900 shadow-sm">
              {avatarUrl && avatarLoad?.loaded !== false && (
                <Image key={avatarUrl} src={avatarUrl} alt="" fill unoptimized
                  className={`rounded-full object-cover ${avatarLoad?.loaded ? '' : 'opacity-0'}`}
                  onLoad={() => setAvatarResult({ url: avatarUrl, loaded: true })}
                  onError={() => setAvatarResult({ url: avatarUrl, loaded: false })} />
              )}
              {avatarLoading ? (
                <span className="spinner motion-safe:animate-spin" role="status" aria-label="Loading avatar" />
              ) : !avatarLoad?.loaded && 'A'}
              {avatarLoad?.loaded && decorationUrl && (
                <Image src={decorationUrl} alt="" fill className="scale-125 object-contain" unoptimized />
              )}
            </div>
            <span className="inline-flex items-center gap-1.5 border border-slate-300 bg-white px-2 py-1 text-slate-800">
              <span aria-hidden="true" className="h-2 w-2 rounded-full"
                style={{ backgroundColor: discordStatus ? getStatusColor(discordStatus) : '#64748b' }} />
              Discord · {statusLabel}
            </span>
          </div>
          <div className="relative min-w-0 pr-10">
            <p className="break-words text-xl font-semibold text-slate-950">{user?.global_name || user?.username || 'akryst'}</p>
            <p className="break-words text-sm text-slate-700">@{user?.username || 'akryst'}</p>
          </div>
          <nav aria-label="Social profiles" className="relative mt-3 flex flex-wrap gap-1.5">
            {socialLinks.map(({ label, url, icon }) => (
              <a key={label} className="aero-link w-8 !px-0" href={url} target="_blank"
                rel="noopener noreferrer" aria-label={label} title={label}>
                <span aria-hidden="true" className={`text-base ${icon}`} />
              </a>
            ))}
          </nav>
        </div>
      </div>
      <div className="status-bar">
        <p className="status-bar-field">{visitors === null ? '—' : visitors.toLocaleString()} visits</p>
        <p className="status-bar-field">{currentTime || '—'}</p>
      </div>
    </section>
  );
}
