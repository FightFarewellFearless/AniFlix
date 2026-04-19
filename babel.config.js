const ReactCompilerConfig = {
  target: '19', // '17' | '18' | '19'
};

module.exports = {
  presets: [['babel-preset-expo']],
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
        alias: {
          '@/*': './src/*',
          '@root/*': './*',
          '@component/*': './src/component/*',
          '@utils/*': './src/utils/*',
          '@assets/*': './src/assets/*',
          '@types/*': './src/types/*',
          '@hooks/*': './src/hooks/*',
          '@misc/*': './src/misc/*',
        },
      },
    ],
    ['module:react-native-dotenv'],
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.md', '.txt'],
      },
    ],
  ],
};
