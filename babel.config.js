module.exports = {
  presets: ['module:@react-native/babel-preset'],
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
