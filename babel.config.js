const ReactCompilerConfig = {
  target: '18', // '17' | '18' | '19'
  sources: (filename) => {
    return filename.includes('src/component');
  },
};

module.exports = {
  presets: [
    ['babel-preset-expo', {
      'react-compiler': ReactCompilerConfig
    }]
  ],
  // eslint-disable-next-line prettier/prettier
  plugins: [
    ['module:react-native-dotenv'],
    [
      "babel-plugin-inline-import",
      {
        "extensions": [".md", ".txt"]
      }
    ],
    'react-native-reanimated/plugin',
  ],
};
