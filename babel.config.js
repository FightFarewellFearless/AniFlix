const ReactCompilerConfig = {
  target: '19', // '17' | '18' | '19'
};

module.exports = {
  presets: [['babel-preset-expo']],
  // presets: ['@react-native/babel-preset'],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
  plugins: [
    // ['babel-plugin-react-compiler', ReactCompilerConfig], // must run first!
    ['module:react-native-dotenv'],
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.md', '.txt'],
      },
    ],
    // 'react-native-worklets/plugin',
  ],
};
