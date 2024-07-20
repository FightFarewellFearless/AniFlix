const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
    resolver: {
        sourceExts: [...defaultConfig.resolver.sourceExts, 'md', 'cjs']
    }
};

module.exports = mergeConfig(defaultConfig, config);
