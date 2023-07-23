import { Home, EpsList, SingleEps } from './anime';

type HomeNavigator = {
  AnimeList: undefined;
  Search: undefined;
  Setting: undefined;
  History: undefined;
};

type RootStackNavigator = {
  loading: undefined;
  Home: {
    data: Home;
  };
  EpisodeList: {
    data: EpsList;
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
  Maintenance: undefined;
};

export type { RootStackNavigator, HomeNavigator };
