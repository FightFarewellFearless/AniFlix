const reactNativeBlobUtil = {
  fs: {
    stat: async (uri: string) => ({
      filename: decodeURIComponent(uri.split(/[\\/]/).pop() || uri),
    }),
  },
};

export default reactNativeBlobUtil;
