interface FromUrl {

}

interface NewAnimeList {
  title: string;
  episode: string;
  thumbnailUrl: string;
  streamingLink: string;
  releaseDate: string;
  releaseDay: string;
}

interface AnimeSchedule {
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
};

interface Blocked extends FromUrl {
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
  synopsis: string;
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
  resolution: string | undefined;
  resolutionRaw: {
    resolution: string;
    dataContent: string;
  }[];
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

interface EpisodeBaruHome {
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
  FromUrl,
  AniStreaming,
  EpisodeBaruHome,
  listAnimeTypeList
};
