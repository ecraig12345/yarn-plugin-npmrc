const fs = require('fs');
const semver = require('semver');
const paths = require('./paths');
const runCommand = require('./runCommand');

const bumpType = /** @type {import('semver').ReleaseType} */ (process.argv[2]);
if (!['major', 'minor', 'patch'].includes(bumpType)) {
  console.error('Usage: node scripts/release.js <major|minor|patch>');
  process.exit(1);
}

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

// generate the bundles
require('./build');

console.log(`Updating package.json version from ${oldVersion} to ${newVersion}`);
packageJsonText = packageJsonText.replace(oldVersion, newVersion);
fs.writeFileSync(paths.packageJson, packageJsonText, 'utf8');

console.log(`Updating README.md versions from ${vOld} to ${vNew}`);
let readmeText = fs.readFileSync(paths.readme, 'utf8');
readmeText = readmeText.replaceAll(vOld, vNew);
fs.writeFileSync(paths.readme, readmeText, 'utf8');

// unstage anything previously staged
runCommand('git', ['reset']);
// add the modified files and commit
runCommand('git', ['add', paths.packageJson, paths.readme, paths.dist]);
runCommand('git', ['commit', '-m', `Bump version to ${vNew}`]);
// tag and push the new version
runCommand('git', ['tag', vNew]);
runCommand('git', ['push', '--tags', 'origin', 'main']);
// create a github release
runCommand('gh', ['release', 'create', '--generate-notes', vNew]);
