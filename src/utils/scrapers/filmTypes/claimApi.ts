export interface ClaimApi {
  kind: string;
  claim: string;
  claimExpiresAt: number;
  redeemUrl: string;
  videoId: string;
  title: string;
  durationSec: null;
  viewerTier: string;
  maxHeight: number;
  renewalToken: string;
}
