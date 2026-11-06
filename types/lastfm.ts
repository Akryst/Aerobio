export interface LastFmTrack {
  name: string;
  artist: {
    '#text': string;
    mbid?: string;
  };
  album?: {
    '#text': string;
    mbid?: string;
  };
  url: string;
  image: Array<{
    size: 'small' | 'medium' | 'large' | 'extralarge';
    '#text': string;
  }>;
  date?: {
    uts: string;
    '#text': string;
  };
  '@attr'?: {
    nowplaying: string;
  };
}

export interface LastFmResponse {
  recenttracks: {
    track: LastFmTrack[];
    '@attr': {
      user: string;
      totalPages: string;
      page: string;
      perPage: string;
      total: string;
    };
  };
}

export interface Track {
  name: string;
  artist: string;
  album?: string;
  url: string;
  image: string;
  timestamp?: string;
  isNowPlaying: boolean;
}
