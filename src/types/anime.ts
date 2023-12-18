interface Maintenance {
  maintenance: boolean;
  message?: string;
}

interface FromUrl extends Maintenance {
  blocked: boolean;
}

interface NewAnimeList extends Maintenance {
  title: string;
  episode: string;
  rating: string;
  thumbnailUrl: string;
  streamingLink: string;
  releaseYear: string;
  status: 'Ongoing' | 'Ended' | 'Movie';
}

interface MovieList extends Maintenance {
  title: string;
  streamingLink: string;
  thumbnailUrl: string;
  rating: string;
  releaseYear: string;
}

interface SearchAnimeList {
  title: string;
  animeUrl: string;
  thumbnailUrl: string;
  episode: string;
  rating: string;
  releaseYear: string;
  status: 'Ongoing' | 'Ended' | 'Movie';
}

type SearchAnime = {
  result: SearchAnimeList[];
} & Maintenance &
  (
    | {
        nextPageAvailable: false;
      }
    | {
        nextPageAvailable: true;
        nextPage: number;
      }
  );

interface Blocked extends FromUrl {
  blocked: true;
  maintenance: false;
}

interface FromUrlMaintenance extends FromUrl {
  blocked: false;
  maintenance: true;
}

type EpsListEpisodeList = { link: string; episode: string };

interface EpsList extends FromUrl {
  type: 'epsList';
  title: string;
  synopsys: string;
  thumbnailUrl: string;
  episodeList: EpsListEpisodeList[];
  genre: string[];
  status: string;
  releaseYear: string;
  rating: string;
}

type SingleEps = FromUrl & {
  type: 'singleEps';
  title: string;
  downloadLink: string;
  genre: string[];
  resolution: string;
  validResolution: string[];
  synopsys: string;
  thumbnailUrl: string;
  releaseYear: string;
  status: 'Ongoing' | 'Ended';
  rating: string;
  episodeData?: {
    previous?: string;
    episodeList: string;
    next?: string;
  };
} & ({
  streamingType: 'raw';
  streamingLink: {
    sources: {
      src: string;
    }[];
  }[];
} | {
  streamingType: 'embed';
  streamingLink: string;
});

interface AnnouncmentEnabled {
  enable: true;
  message: string;
}

interface AnnouncmentDisabled {
  enable: false;
}

interface Home extends Maintenance {
  movie: MovieList[];
  newAnime: NewAnimeList[];
  announcment: AnnouncmentEnabled | AnnouncmentDisabled;
  uptime: number;
  waktuServer: string;
}

interface listAnimeTypeList {
  title: string;
  streamingLink: string;
}

export type {
  NewAnimeList,
  MovieList,
  SearchAnimeList,
  SearchAnime,
  EpsListEpisodeList,
  EpsList,
  Blocked,
  Maintenance,
  FromUrlMaintenance,
  SingleEps,
  Home,
  listAnimeTypeList
};
