// @ts-check
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const semver = require('semver');

const bumpType = /** @type {import('semver').ReleaseType} */ (process.argv[2]);
if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('Usage: node scripts/release.js <major|minor|patch>');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const bundlesPath = path.join(root, 'bundles/@yarnpkg');
const paths = {
  root,
  packageJson: path.join(root, 'package.json'),
  readme: path.join(root, 'README.md'),
  bundles: bundlesPath,
  minBundle: path.join(bundlesPath, 'plugin-npmrc.js'),
  devBundle: path.join(bundlesPath, 'plugin-npmrc-dev.js'),
};

let packageJsonText = fs.readFileSync(paths.packageJson, 'utf8');
const oldVersion = JSON.parse(packageJsonText).version;
const newVersion = semver.inc(oldVersion, bumpType);
if (!newVersion) {
  // shouldn't be possible
  console.error(`Could not bump version from ${oldVersion} with type ${bumpType}`);
  process.exit(1);
}
const vOld = `v${oldVersion}`;
const vNew = `v${newVersion}`;

packageJsonText = packageJsonText.replace(oldVersion, newVersion);
fs.writeFileSync(paths.packageJson, packageJsonText, 'utf8');

let readmeText = fs.readFileSync(paths.readme, 'utf8');
readmeText = readmeText.replaceAll(vOld, vNew);
fs.writeFileSync(paths.readme, readmeText, 'utf8');

fs.rmSync(paths.bundles, { recursive: true, force: true });
// build and move the dev bundle
runCommand('yarn', ['build:dev']);
fs.renameSync(paths.minBundle, paths.devBundle);
// build the min bundle
runCommand('yarn', ['build']);

// unstage anything previously staged
runCommand('git', ['reset']);
// add the modified files and commit
runCommand('git', ['add', paths.packageJson, paths.readme, paths.bundles]);
runCommand('git', ['commit', '-m', `Bump version to ${vNew}`]);
// tag and push the new version
runCommand('git', ['tag', vNew]);
runCommand('git', ['push', '--tags', 'origin', 'main']);

function runCommand(command, args) {
  console.log(`Running: ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, { stdio: 'inherit', cwd: root });
  if (result.error) {
    console.error(`Error running ${command}: ${result.error.message}`);
    process.exit(1);
  }
}
