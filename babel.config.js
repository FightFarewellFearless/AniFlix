const ReactCompilerConfig = {
  target: '19', // '17' | '18' | '19'
  sources: filename => {
    return filename.includes('src/component');
  },
};

module.exports = {
  presets: [
    [
      'babel-preset-expo',
      {
        'react-compiler': ReactCompilerConfig,
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
    'react-native-reanimated/plugin',
  ],
};
