interface Maintenance {
  maintenance: boolean;
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

interface SearchAnimeList extends Maintenance {
  title: string;
  animeUrl: string;
  thumbnailUrl: string;
  episode: string;
  rating: string;
  releaseYear: string;
  status: 'Ongoing' | 'Ended' | 'Movie';
}

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

interface SingleEps extends FromUrl {
  type: 'singleEps';
  title: string;
  streamingLink: {
    sources: {
      src: string;
    }[];
  }[];
  downloadLink: string;
  genre: string[];
  resolution: string;
  validResolution: string[];
  synopsys: string;
  thumbnailUrl: string;
  releaseYear: string;
  status: 'Ongoing' | 'Ended';
  rating: string;
  episodeData: {
    previous?: string;
    episodeList: string;
    next?: string;
  };
}

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

export type {
  NewAnimeList,
  MovieList,
  SearchAnimeList,
  EpsListEpisodeList,
  EpsList,
  Blocked,
  Maintenance,
  FromUrlMaintenance,
  SingleEps,
  Home,
};
