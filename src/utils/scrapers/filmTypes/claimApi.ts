export interface ClaimApi {
  kind: string;
  claim: string;
  redeemUrl: string;
  videoId: string;
  title: string;
  durationSec: number;
  preroll: Preroll;
}

interface Preroll {
  ad: Ad;
  countdownSec: number;
}

interface Ad {
  id: string;
  name: string;
  imageUrl: string;
  targetUrl: string;
  htmlContent: null;
  config: Config;
}

interface Config {
  duration: number;
}
