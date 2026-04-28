export interface RedeemApi {
  code: string;
  url: string;
  expiresAt: number;
  subtitles: Subtitle[];
  videoId: string;
}

interface Subtitle {
  lang: string;
  label: string;
  path: string;
}
