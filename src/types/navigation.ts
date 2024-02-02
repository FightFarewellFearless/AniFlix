import { Home, AniDetail, AniStreaming } from './anime';

type HomeNavigator = {
  AnimeList: undefined;
  Chat: undefined;
  Search: undefined;
  History: undefined;
  WatchLater: undefined;
  Setting: undefined;
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

type HomeStackNavigator = {
  SeeMore: {
    type: 'AnimeList' | 'MovieList';
  };
  HomeList: undefined;
};

export type { RootStackNavigator, HomeNavigator, HomeStackNavigator };
