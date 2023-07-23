interface HistoryJSON extends HistoryAdditionalData {
  title: string;
  episode: string | null;
  link: string;
  thumbnailUrl: string;
  date: number;
}

interface HistoryAdditionalData {
  part?: number | undefined;
  resolution?: string;
  lastDuration?: number;
}

export type { HistoryJSON, HistoryAdditionalData };
