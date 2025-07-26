const ReactCompilerConfig = {
  target: '19', // '17' | '18' | '19'
};

module.exports = {
  presets: [
    [
      'babel-preset-expo',
      {
        'react-compiler': ReactCompilerConfig,
        reanimated: false,
      },
    ],
  ],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
  plugins: [
    ['module:react-native-dotenv'],
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.md', '.txt'],
      },
    ],
    'react-native-worklets/plugin',
  ],
};
