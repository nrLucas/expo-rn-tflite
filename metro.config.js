module.exports = {
  // We need to make sure that only one version is loaded for peerDependencies
  // So we block them at the root, and alias them to the versions in example's node_modules
  resolver: {
    assetExts: ["tflite", "png", "jpg"],
  },
};
