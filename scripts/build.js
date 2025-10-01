const fs = require('fs');
const runCommand = require('./runCommand');
const paths = require('./paths');

// These can be updated if needed, but the goal is to keep them low to reduce parse time penalty
// on EVERY yarn command (even when the plugin isn't used)
const maxKbDev = 75;
const maxKbMin = 30;

// Follow the EOL which appears to be used by git in the output files, since they're checked in
const gitEol = fs.readFileSync(paths.packageJson, 'utf8').match(/\r?\n/)?.[0] || '\n';

fs.rmSync(paths.dist, { recursive: true, force: true });
fs.mkdirSync(paths.dist, { recursive: true });

runBuild(true);
runBuild(false);

function runBuild(/** @type {boolean} */ minify) {
  // The yarn builder has no way to specify output paths, so manually rename the files...
  runCommand('yarn', ['builder', 'build', 'plugin', ...(minify ? [] : ['--no-minify'])]);

  const bundlePath = minify ? paths.minBundle : paths.devBundle;

  const stats = fs.statSync(paths.bundleFile);
  const kb = Math.round(stats.size / 1024);
  const maxKb = minify ? maxKbMin : maxKbDev;
  if (kb > maxKb) {
    console.error(
      `❌ ${bundlePath} bundle size has increased: ${kb} KB (previous limit: ${maxKb} KB)`,
    );
    console.log(
      'You can increase the size in scripts/build.js if needed, but first check the diff ' +
        'to see what changed and if anything can be removed.',
    );
    process.exit(1);
  }

  // Normalize EOL to avoid spurious diffs
  const contents = fs.readFileSync(paths.bundleFile, 'utf8').replace(/\r?\n/g, gitEol);
  fs.writeFileSync(bundlePath, contents);
  console.log(`✅ Updated ${bundlePath}\n`);
}
