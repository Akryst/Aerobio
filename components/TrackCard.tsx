import Image from 'next/image';
import type { Track } from '@/types/lastfm';

function formatTimeAgo(timestamp: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Number(timestamp) * 1000) / 60000));
  if (!Number.isFinite(minutes)) return '';
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
}

export default function TrackCard({ track, stale }: { track: Track; stale: boolean }) {
  const playing = track.isNowPlaying && !stale;

  return (
    <a href={track.url} target="_blank" rel="noopener noreferrer"
      className={`flex items-center gap-3 border-b border-slate-200 p-2 text-slate-900 no-underline hover:bg-blue-50 focus-visible:outline-offset-[-2px] sm:p-3 ${playing ? 'bg-sky-50' : 'bg-white'}`}>
      <div className="relative h-10 w-10 shrink-0 overflow-hidden border border-slate-300 sm:h-12 sm:w-12">
        {track.image ? (
          <Image src={track.image} alt="" fill className="object-cover" unoptimized />
        ) : (
          <span aria-hidden="true" className="grid h-full place-items-center bg-blue-100 text-blue-900">♪</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold" title={track.name}>{track.name}</h3>
        <p className="truncate text-xs text-slate-700">{track.artist}{track.album && ` · ${track.album}`}</p>
      </div>
      {playing ? (
        <span className="shrink-0 border border-emerald-300 bg-emerald-100 px-1.5 py-0.5 text-emerald-900">
          ▶ Playing
        </span>
      ) : track.timestamp && (
        <span className="shrink-0 text-slate-600">{formatTimeAgo(track.timestamp)}</span>
      )}
    </a>
  );
}
