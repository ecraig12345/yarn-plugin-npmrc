const fs = require('fs');
const runCommand = require('./runCommand');
const paths = require('./paths');

fs.rmSync(paths.dist, { recursive: true, force: true });
fs.mkdirSync(paths.dist, { recursive: true });

runBuild(true);
runBuild(false);

function runBuild(/** @type {boolean} */ minify) {
  // The yarn builder has no way to specify output paths, so manually rename the files...
  // Also fix EOLs on Windows
  runCommand('yarn', ['builder', 'build', 'plugin', ...(minify ? [] : ['--no-minify'])]);
  const contents = fs.readFileSync(paths.bundleFile, 'utf8').replace(/\r\n/g, '\n');
  fs.writeFileSync(minify ? paths.minBundle : paths.devBundle, contents);
}
