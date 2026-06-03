declare module 'react-native-config' {
  export interface NativeConfig {
    WEBHOOK_WHITELIST_URL: string;
    WEBHOOK_REPORT_ERROR: string;
    COMICS1_AUTH: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
