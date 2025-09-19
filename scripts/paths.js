const path = require('path');

const root = path.resolve(__dirname, '..');
const distPath = path.join(root, 'dist');

module.exports = {
  root,
  packageJson: path.join(root, 'package.json'),
  readme: path.join(root, 'README.md'),
  bundleFile: path.join(root, 'bundles/@yarnpkg/plugin-npmrc.js'),
  dist: distPath,
  minBundle: path.join(distPath, 'plugin-npmrc.js'),
  devBundle: path.join(distPath, 'plugin-npmrc.dev.js'),
};
