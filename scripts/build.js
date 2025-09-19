const fs = require('fs');
const runCommand = require('./runCommand');
const paths = require('./paths');

fs.rmSync(paths.dist, { recursive: true, force: true });
fs.mkdirSync(paths.dist, { recursive: true });

// The yarn builder has no way to specify output paths, so manually rename the files...
runCommand('yarn', ['builder', 'build', 'plugin']);
fs.renameSync(paths.bundleFile, paths.minBundle);

runCommand('yarn', ['builder', 'build', 'plugin', '--no-minify']);
fs.renameSync(paths.bundleFile, paths.devBundle);
