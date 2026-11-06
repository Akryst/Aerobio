'use client';

import { useEffect, useState } from 'react';
import type { Track } from '@/types/lastfm';
import TrackCard from './TrackCard';

export default function RecentTracks() {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      try {
        const response = await fetch('/api/recent-tracks', { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data: Track[] = await response.json();
        if (!controller.signal.aborted) {
          setTracks(data);
          setFailed(false);
        }
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(refresh, 30_000);
      }
    }

    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="space-y-2">
      {failed && (
        <p role="status" className="border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
          {tracks?.length ? 'Last.fm is unavailable. Showing the last update.' : 'Last.fm is unavailable. Retrying shortly.'}
        </p>
      )}
      {tracks === null && !failed && (
        <p role="status" className="p-6 text-center text-slate-600">Loading recent tracks…</p>
      )}
      {tracks?.length === 0 && !failed && (
        <p className="p-6 text-center text-slate-700">No recent tracks yet.</p>
      )}
      {!!tracks?.length && (
        <ol className="has-scrollbar max-h-[360px] overflow-y-auto border border-slate-200 bg-white">
          {tracks.map((track, index) => (
            <li key={`${track.artist}-${track.name}-${track.timestamp ?? index}`}>
              <TrackCard track={track} stale={failed} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
