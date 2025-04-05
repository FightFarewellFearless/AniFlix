import { getStreamingDetail, MovieDetail } from '../utils/animeMovie';
import { AniDetail, AniStreaming, EpisodeBaruHome } from './anime';

type HomeNavigator = {
  AnimeList: undefined;
  Utilitas: undefined;
  Search: undefined;
  Saya: undefined;
};

type RootStackNavigator = {
  connectToServer: undefined;
  Home: {
    data: EpisodeBaruHome;
  };
  AnimeDetail: {
    data: AniDetail;
    link: string;
  };
  MovieDetail: {
    data: MovieDetail;
    link: string;
  };
  FromUrl: {
    link: string;
    isMovie?: boolean;
    historyData?: {
      resolution: string;
      lastDuration: number;
    };
  };
  Video: {
    data: AniStreaming | Awaited<ReturnType<typeof getStreamingDetail>>;
    link: string;
    historyData?: {
      resolution: string | undefined;
      lastDuration: number;
    };
    isMovie?: boolean;
  };
  NeedUpdate:
    | {
        nativeUpdate: true;
        latestVersion: string;
        changelog: string;
        download: string;
      }
    | {
        nativeUpdate: false;
        changelog: string;
        size: number;
      };
  Blocked: {
    title: string;
    url: string;
    data: AniDetail;
  };
  FailedToConnect: undefined;
  Maintenance: {
    message?: string;
  };
  SeeMore: {
    type: 'AnimeList' | 'MovieList';
  };
  Blank: undefined;
};

type UtilsStackNavigator = {
  ChooseScreen: undefined;
  SearchAnimeByImage: undefined;
  Changelog: undefined;
  Setting: undefined;
  About: undefined;
  SupportDev: undefined;
};

type SayaDrawerNavigator = {
  History: undefined;
  WatchLater: undefined;
};

export type { HomeNavigator, RootStackNavigator, SayaDrawerNavigator, UtilsStackNavigator };
