const ReactCompilerConfig = {
  target: '19', // '17' | '18' | '19'
};
/** @type {import('react-native-worklets/plugin').PluginOptions} */
const workletsPluginOptions = {
  bundleMode: true,
  strictGlobal: true, // optional, but recommended
};

module.exports = {
  presets: [
    [
      'babel-preset-expo',
      {
        reanimated: false,
        worklets: false,
      },
    ],
  ],
  // presets: ['@react-native/babel-preset'],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
  plugins: [
    // ['babel-plugin-react-compiler', ReactCompilerConfig], // must run first!
    // 'react-native-worklets/plugin',
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.js',
          '.jsx',
          '.ts',
          '.tsx',
          '.ios.js',
          '.android.js',
          '.ios.tsx',
          '.android.tsx',
          '.ios.ts',
          '.android.ts',
          '.json',
          '.md',
          '.txt',
        ],
        alias: {
          '@': './src',
          '@root': '.',
          '@component': './src/component',
          '@utils': './src/utils',
          '@assets': './src/assets',
          '@types': './src/types',
          '@hooks': './src/hooks',
          '@misc': './src/misc',
        },
      },
    ],
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.md', '.txt'],
      },
    ],
    ['react-native-worklets/plugin', workletsPluginOptions],
  ],
};
