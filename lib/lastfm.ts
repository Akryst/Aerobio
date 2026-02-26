import { LastFmResponse, Track, LastFmTopTracksResponse, TopTrack } from '@/types/lastfm';

const LASTFM_API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY || '';
const LASTFM_USERNAME = process.env.NEXT_PUBLIC_LASTFM_USERNAME || '';

export async function getRecentTracks(limit: number = 10): Promise<Track[]> {
  if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
    console.error('Last.fm API key or username not configured');
    return [];
  }

  try {
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.append('method', 'user.getrecenttracks');
    url.searchParams.append('user', LASTFM_USERNAME);
    url.searchParams.append('api_key', LASTFM_API_KEY);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', limit.toString());

    const response = await fetch(url.toString(), {
      next: { revalidate: 30 } // Revalidate every 30 seconds
    });

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data: LastFmResponse = await response.json();

    if (!data.recenttracks || !data.recenttracks.track) {
      return [];
    }

    return data.recenttracks.track.map((track) => ({
      name: track.name,
      artist: track.artist['#text'],
      album: track.album?.['#text'],
      url: track.url,
      image: track.image.find((img) => img.size === 'large')?.['#text'] || '',
      timestamp: track.date?.uts,
      isNowPlaying: track['@attr']?.nowplaying === 'true',
    }));
  } catch (error) {
    console.error('Error fetching Last.fm tracks:', error);
    return [];
  }
}

export function formatTimeAgo(timestamp?: string): string {
  if (!timestamp) return 'Just now';

  const now = Date.now();
  const then = parseInt(timestamp) * 1000;
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export async function getTopTracks(limit: number = 10, period: '1month' | '3month' | '6month' | '12month' = '1month'): Promise<TopTrack[]> {
  if (!LASTFM_API_KEY || !LASTFM_USERNAME) {
    console.error('Last.fm API key or username not configured');
    return [];
  }

  try {
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    url.searchParams.append('method', 'user.gettoptracks');
    url.searchParams.append('user', LASTFM_USERNAME);
    url.searchParams.append('api_key', LASTFM_API_KEY);
    url.searchParams.append('format', 'json');
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('period', period);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data: LastFmTopTracksResponse = await response.json();

    if (!data.toptracks || !data.toptracks.track) {
      return [];
    }

    const tracksWithImages = await Promise.all(
      data.toptracks.track.map(async (track) => {
        let image = track.image.find((img) => img.size === 'large')?.['#text'] || '';
        
        if (!image || image.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
          try {
            const infoUrl = new URL('https://ws.audioscrobbler.com/2.0/');
            infoUrl.searchParams.append('method', 'track.getInfo');
            infoUrl.searchParams.append('artist', track.artist.name);
            infoUrl.searchParams.append('track', track.name);
            infoUrl.searchParams.append('api_key', LASTFM_API_KEY);
            infoUrl.searchParams.append('format', 'json');

            const infoResponse = await fetch(infoUrl.toString(), {
              next: { revalidate: 3600 } // Cache for 1 hour
            });

            if (infoResponse.ok) {
              const infoData = await infoResponse.json();
              const albumImage = infoData.track?.album?.image?.find((img: any) => img.size === 'large')?.['#text'];
              if (albumImage && !albumImage.includes('2a96cbd8b46e442fc41c2b86b821562f')) {
                image = albumImage;
              }
            }
          } catch (err) {
            console.error(`Failed to fetch album art for ${track.name}:`, err);
          }
        }

        return {
          name: track.name,
          artist: track.artist.name,
          url: track.url,
          image,
          playcount: parseInt(track.playcount),
          rank: parseInt(track['@attr'].rank),
        };
      })
    );

    return tracksWithImages;
  } catch (error) {
    console.error('Error fetching Last.fm top tracks:', error);
    return [];
  }
}
