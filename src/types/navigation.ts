import { Home, EpsList, SingleEps } from './anime';

type HomeNavigator = {
  AnimeList: undefined;
  Search: undefined;
  History: undefined;
  WatchLater: undefined;
  Setting: undefined;
};

type RootStackNavigator = {
  loading: undefined;
  Home: {
    data: Home;
  };
  EpisodeList: {
    data: EpsList;
    link: string;
  };
  FromUrl: {
    link: string;
    historyData?: {
      part: number | undefined;
      resolution: string;
      lastDuration: number;
    };
  };
  Video: {
    data: SingleEps;
    link: string;
    historyData?: {
      part: number | undefined;
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

export type { RootStackNavigator, HomeNavigator };
