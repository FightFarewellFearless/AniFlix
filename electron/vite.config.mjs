import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path';

// Daftar paket yang hanya untuk Android (tidak boleh di-bundle di Windows)
const androidOnlyPackages = [
  'react-native-blob-util',
  'react-native-zip-archive',
  'react-native-nitro-http-server',
  'react-native-nitro-device-info',
  'react-native-orientation-locker',
  'react-native-edge-to-edge',
  'react-native-system-navigation-bar',
  'react-native-keyboard-controller',
  'react-native-saf-x',
  'expo',
  'expo-sqlite',
  'expo-updates',
  'expo-video',
  'expo-document-picker',
  'expo-splash-screen',
  'expo-keep-awake',
  '@preeternal/react-native-cookie-manager',
  'react-native-worklets',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-screens',
  'react-native-safe-area-context',
  'react-native-paper',
  'react-native-vector-icons',
  'react-native-svg',
  'react-native-animateable-text',
  'react-native-error-boundary',
  'react-native-marked',
  'react-native-bottom-tabs',
  '@bottom-tabs/react-navigation',
  '@react-navigation/native',
  '@react-navigation/native-stack',
  '@react-navigation/drawer',
  '@shopify/flash-list',
  '@legendapp/list',
  '@expo/ui',
];

const platformModules = [
  'FileSystem',
  'DatabaseManager',
  'CookieManager',
  'HttpServer',
  'KeepAwake',
  'SafStorage',
  'DeviceInfo',
  'Orientation',
  'SystemBars',
  'SystemNavigationBar',
  'KeyboardController',
  'Toast',
  'DocumentPicker',
  'Updates',
];

const platformAlias = platformModules.map((mod) => ({
  find: new RegExp(`^@/platform/${mod}$`),
  replacement: path.resolve(__dirname, `../src/platform/${mod}.windows.ts`),
}));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  root: 'src',
  base: './',
  build: {
    outDir: '../dist/renderer',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      external: [
        'electron',
      ],
    },
  },
  resolve: {
    // The alias list is an array (instead of an object) so that we can use
    // exact-match regular expressions. Several packages must only be replaced
    // on an exact match, otherwise their type-only sub imports would break.
    alias: [
      // React Native RecyclerView based lists cannot render in a browser.
      {
        find: /^@shopify\/flash-list$/,
        replacement: path.resolve(__dirname, './src/shims/flashList.tsx'),
      },
      {
        find: /^@legendapp\/list$/,
        replacement: path.resolve(__dirname, './src/shims/legendList.tsx'),
      },
      // react-native-webview is a native module, Electron uses the <webview> tag.
      {
        find: /^react-native-webview$/,
        replacement: path.resolve(__dirname, './src/shims/webView.tsx'),
      },
      {
        find: /^react$/,
        replacement: path.resolve(__dirname, './node_modules/react'),
      },
      {
        find: /^react-dom$/,
        replacement: path.resolve(__dirname, './node_modules/react-dom'),
      },
      {
        find: /^react-native$/,
        replacement: path.resolve(__dirname, './src/shims/reactNative.ts'),
      },
      {
        find: /^react-native-blob-util$/,
        replacement: path.resolve(__dirname, './src/shims/reactNativeBlobUtil.ts'),
      },
      {
        find: /^react-native-error-boundary$/,
        replacement: path.resolve(__dirname, './src/shims/ErrorBoundary.tsx'),
      },
      {
        find: /^react-native-gesture-handler$/,
        replacement: path.resolve(__dirname, './src/shims/gestureHandler.tsx'),
      },
      {
        find: /^react-native-reanimated$/,
        replacement: path.resolve(__dirname, './src/shims/reanimated.tsx'),
      },
      {
        find: /^react-native-worklets$/,
        replacement: path.resolve(__dirname, './src/shims/worklets.ts'),
      },
      {
        find: /^react-native-safe-area-context$/,
        replacement: path.resolve(__dirname, './src/shims/safeArea.tsx'),
      },
      {
        find: /^react-native-animateable-text$/,
        replacement: path.resolve(__dirname, './src/shims/animateableText.tsx'),
      },
      {
        find: /^react-native-svg$/,
        replacement: path.resolve(__dirname, './src/shims/svg.tsx'),
      },
      {
        find: /^react-native-screens$/,
        replacement: path.resolve(__dirname, './src/shims/screens.ts'),
      },
      {
        find: /^react-native-keyboard-controller$/,
        replacement: path.resolve(__dirname, './src/shims/keyboardController.tsx'),
      },
      {
        find: /^react-native-zip-archive$/,
        replacement: path.resolve(__dirname, './src/shims/zipArchive.ts'),
      },
      {
        find: /^expo-video$/,
        replacement: path.resolve(__dirname, './src/shims/expoVideo.tsx'),
      },
      {
        find: /^expo$/,
        replacement: path.resolve(__dirname, './src/shims/expo/index.ts'),
      },
      {
        // `expo/fetch` and friends live next to the `expo` shim.
        find: /^expo\/(.*)$/,
        replacement: path.resolve(__dirname, './src/shims/expo/$1'),
      },
      {
        find: /^@bottom-tabs\/react-navigation$/,
        replacement: path.resolve(__dirname, './src/shims/bottomTabs.tsx'),
      },
      {
        find: /^expo-linear-gradient$/,
        replacement: path.resolve(__dirname, './src/shims/linearGradient.tsx'),
      },
      {
        find: /^expo-splash-screen$/,
        replacement: path.resolve(__dirname, './src/shims/splashScreen.ts'),
      },
      {
        find: /^expo-modules-core$/,
        replacement: path.resolve(__dirname, './src/shims/expoModulesCore.ts'),
      },
      {
        find: /^@expo\/ui\/community\/picker$/,
        replacement: path.resolve(__dirname, './src/shims/expoUi/community/picker.tsx'),
      },
      {
        find: /^@expo\/ui$/,
        replacement: path.resolve(__dirname, './src/shims/expoUi'),
      },
      // Platform specific implementations. These have to be listed before the
      // generic `@/...` rule so that `@/platform/Toast` resolves to
      // `Toast.windows.ts` and not to the generic TypeScript implementation.
      ...platformAlias,
      {
        // The Android player is built on expo-video, reanimated and gesture
        // handler. None of those exist in Electron, so the Watch screens use a
        // DOM/HLS based player on Windows. Android still resolves index.tsx.
        find: /^@component\/VideoPlayer$/,
        replacement: path.resolve(
          __dirname,
          '../src/component/VideoPlayer/index.windows.tsx',
        ),
      },
      {
        find: /^@\/(.*)$/,
        replacement: path.resolve(__dirname, '../src/$1'),
      },
      {
        find: /^@$/,
        replacement: path.resolve(__dirname, '../src'),
      },
      // Prefix aliases. These MUST match subpaths as well (`@assets/style`,
      // `@component/Home/Home`); an exact-only alias leaves every subpath
      // unresolved and the renderer fails with a 500 before the app mounts.
      {
        find: /^@root\/(.*)$/,
        replacement: path.resolve(__dirname, '../$1'),
      },
      {
        find: /^@root$/,
        replacement: path.resolve(__dirname, '..'),
      },
      {
        find: /^@platform\/(.*)$/,
        replacement: path.resolve(__dirname, '../src/platform/$1'),
      },
      {
        find: /^@platform$/,
        replacement: path.resolve(__dirname, '../src/platform'),
      },
      {
        find: /^@utils\/(.*)$/,
        replacement: path.resolve(__dirname, '../src/utils/$1'),
      },
      {
        find: /^@utils$/,
        replacement: path.resolve(__dirname, '../src/utils'),
      },
      {
        find: /^@component\/(.*)$/,
        replacement: path.resolve(__dirname, '../src/component/$1'),
      },
      {
        find: /^@component$/,
        replacement: path.resolve(__dirname, '../src/component'),
      },
      {
        find: /^@assets\/(.*)$/,
        replacement: path.resolve(__dirname, '../src/assets/$1'),
      },
      {
        find: /^@assets$/,
        replacement: path.resolve(__dirname, '../src/assets'),
      },
      {
        find: /^@hooks\/(.*)$/,
        replacement: path.resolve(__dirname, '../src/hooks/$1'),
      },
      {
        find: /^@hooks$/,
        replacement: path.resolve(__dirname, '../src/hooks'),
      },
      {
        find: /^@misc\/(.*)$/,
        replacement: path.resolve(__dirname, '../src/misc/$1'),
      },
      {
        find: /^@misc$/,
        replacement: path.resolve(__dirname, '../src/misc'),
      },
      {
        find: /^@types\/(.*)$/,
        replacement: path.resolve(__dirname, '../src/types/$1'),
      },
      {
        find: /^@types$/,
        replacement: path.resolve(__dirname, '../src/types'),
      },
    ],
  },
  server: {
    port: 8081,
    strictPort: true,
  },
  define: {
    'global': 'globalThis',
    // The shared React Native sources use `require()` to eagerly load screens in
    // development (a Metro-only feature). The Electron renderer is a plain ESM
    // browser bundle, so `require` is not defined there and the app crashes on
    // start. The lazy `import()` branch works in both, so the Electron build
    // always uses it - same behaviour as a production build.
    __DEV__: false,
  },
}));
