const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add SVG support
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');

// Bundle GTFS .txt files as native assets so they can be read with expo-file-system
// (fetch() with a relative path fails on Android: "no protocol").
if (!config.resolver.assetExts.includes('txt')) {
  config.resolver.assetExts.push('txt');
}

// Add GTFS JSON transform
config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

// Path aliases
config.resolver.alias = {
  '@': './src',
  '~': './src',
};

module.exports = config;