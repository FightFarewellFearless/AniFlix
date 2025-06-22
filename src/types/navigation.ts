import { MovieDetail, MovieStreamingDetail } from '../utils/animeMovie';
import { KomikuDetail, KomikuReading } from '../utils/komiku';
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
  ComicsDetail: {
    data: KomikuDetail;
    link: string;
  };
  ComicsReading: {
    data: KomikuReading;
    link: string;
    historyData: {
      lastDuration?: number;
    };
  };
  FromUrl: {
    link: string;
    type?: 'comics' | 'anime' | 'movie';
    historyData?: {
      resolution: string;
      lastDuration: number;
    };
  };
  Video: {
    data: AniStreaming | MovieStreamingDetail;
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
    data: AniDetail | KomikuDetail;
  };
  FailedToConnect: undefined;
  Maintenance: {
    message?: string;
  };
  SeeMore: {
    type: 'AnimeList' | 'MovieList';
  };
  ErrorScreen: { error: Error };
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
