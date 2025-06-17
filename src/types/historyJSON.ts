interface HistoryJSON extends Partial<HistoryAdditionalData> {
  title: string;
  episode: string | null;
  link: string;
  thumbnailUrl: string;
  date: number;
  isMovie?: boolean;
  isComics?: boolean;
}

interface HistoryAdditionalData {
  resolution: string;
  lastDuration: number;
}

export type { HistoryJSON, HistoryAdditionalData };
