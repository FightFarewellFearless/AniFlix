export interface PlayInfo {
  kind: string;
  gateToken: string;
  serverNow: number;
  unlockAt: number;
  viewerTier: string;
  maxHeight: number;
  preroll: Preroll;
  verification?: PlayVerification | null;
}

interface PlayVerification {
  siteKey: string;
  action: string;
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
