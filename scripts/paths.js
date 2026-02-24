const path = require('path');

const root = path.resolve(__dirname, '..');
const distPath = path.join(root, 'dist');
const bundlesPath = path.join(root, 'bundles');

/** Absolute paths to various files and folders */
module.exports = {
  root,
  packageJson: path.join(root, 'package.json'),
  readme: path.join(root, 'README.md'),
  bundleFile: path.join(bundlesPath, '@yarnpkg/plugin-npmrc.js'),
  dist: distPath,
  bundles: bundlesPath,
  minBundle: path.join(distPath, 'plugin-npmrc.js'),
  devBundle: path.join(distPath, 'plugin-npmrc.dev.js'),
};
