interface Maintenance {
  // maintenance: boolean;
  // message?: string;
}

interface FromUrl extends Maintenance {
  // blocked: boolean;
}

interface NewAnimeList extends Maintenance {
  title: string;
  episode: string;
  thumbnailUrl: string;
  streamingLink: string;
  releaseDate: string;
  releaseDay: string;
}

interface AnimeSchedule extends Maintenance {
  title: string;
  link: string;
}

type JadwalAnime = {
  [hari: string]: AnimeSchedule[];
};

interface SearchAnimeList {
  title: string;
  genres: string[];
  status: string;
  animeUrl: string;
  thumbnailUrl: string;
  rating: string;
}

type SearchAnime = {
  result: SearchAnimeList[];
} & Maintenance;

interface Blocked extends FromUrl {
  // blocked: true;
  // maintenance: false;
}

interface FromUrlMaintenance extends FromUrl {
  // blocked: false;
  // maintenance: true;
}

type AniDetailEpsList = {
  title: string;
  link: string;
  releaseDate: string;
}
interface AniDetail extends FromUrl {
  type: 'animeDetail';
  title: string;
  genres: string[];
  synopsys: string;
  detailOnly: boolean;
  episodeList: AniDetailEpsList[];
  epsTotal: string;
  minutesPerEp: string;
  thumbnailUrl: string;
  alternativeTitle: string;
  rating: string;
  releaseYear: string;
  status: string;
  studio: string;
  animeType: string;
}

type AniStreaming = FromUrl & {
  type: 'animeStreaming';
  title: string;
  streamingLink: string;
  streamingType: 'raw' | 'embed';
  downloadLink: string;
  resolution: string;
  resolutionRaw: {
    "360p"?: string;
    "480p"?: string;
    "720p"?: string;
  };
  thumbnailUrl: string;
  episodeData: {
    previous?: string;
    animeDetail: string;
    next?: string;
  };
  reqNonceAction: string;
  reqResolutionWithNonceAction: string;
};

interface AnnouncmentEnabled {
  enable: true;
  message: string;
}

interface AnnouncmentDisabled {
  enable: false;
}

interface Home extends Maintenance {
  newAnime: NewAnimeList[];
  jadwalAnime: JadwalAnime;
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
  JadwalAnime,
  SearchAnimeList,
  SearchAnime,
  AniDetailEpsList,
  AniDetail,
  Blocked,
  Maintenance,
  FromUrlMaintenance,
  AniStreaming,
  Home,
  listAnimeTypeList
};
