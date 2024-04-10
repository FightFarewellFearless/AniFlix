import { Home, AniDetail, AniStreaming } from './anime';

type HomeNavigator = {
  AnimeList: undefined;
  Utilitas: undefined;
  Search: undefined;
  Saya: undefined;
};

type RootStackNavigator = {
  connectToServer: undefined;
  Home: {
    data: Home;
  };
  AnimeDetail: {
    data: AniDetail;
    link: string;
  };
  FromUrl: {
    link: string;
    historyData?: {
      resolution: string;
      lastDuration: number;
    };
  };
  Video: {
    data: AniStreaming;
    link: string;
    historyData?: {
      resolution: string;
      lastDuration: number;
    };
  };
  NeedUpdate: {
    latestVersion: string;
    changelog: string;
    download: string;
  };
  Blocked: undefined;
  FailedToConnect: undefined;
  Maintenance: {
    message?: string;
  };
};

type UtilsStackNavigator = {
  ChooseScreen: undefined;
  Chat: undefined;
  SearchAnimeByImage: undefined;
  Changelog: undefined;
  Setting: undefined;
};

type HomeStackNavigator = {
  SeeMore: {
    type: 'AnimeList' | 'MovieList';
  };
  HomeList: undefined;
};

type SayaDrawerNavigator = {
  History: undefined;
  WatchLater: undefined;
};

export type { RootStackNavigator, HomeNavigator, HomeStackNavigator, UtilsStackNavigator, SayaDrawerNavigator };
