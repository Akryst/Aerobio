import type { LastFmResponse, Track } from '@/types/lastfm';

export async function getRecentTracks(limit: number): Promise<Track[]> {
  const apiKey = process.env.LASTFM_API_KEY || process.env.NEXT_PUBLIC_LASTFM_API_KEY;
  const username = process.env.LASTFM_USERNAME || process.env.NEXT_PUBLIC_LASTFM_USERNAME;
  if (!apiKey || !username) throw new Error('Last.fm is not configured');

  const url = new URL('https://ws.audioscrobbler.com/2.0/');
  url.search = new URLSearchParams({
    method: 'user.getrecenttracks',
    user: username,
    api_key: apiKey,
    format: 'json',
    limit: String(limit),
  }).toString();

  const response = await fetch(url, {
    next: { revalidate: 30 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`Last.fm returned HTTP ${response.status}`);

  const data: LastFmResponse = await response.json();
  const tracks = data.recenttracks?.track;
  if (!Array.isArray(tracks)) throw new Error('Unexpected Last.fm response');

  return tracks.map((track) => ({
    name: track.name,
    artist: track.artist['#text'],
    album: track.album?.['#text'],
    url: track.url,
    image: track.image.find((img) => img.size === 'large')?.['#text'] || '',
    timestamp: track.date?.uts,
    isNowPlaying: track['@attr']?.nowplaying === 'true',
  }));
}
