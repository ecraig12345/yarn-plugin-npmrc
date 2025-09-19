// @ts-check

const { spawnSync } = require('child_process');
const path = require('path');

/**
 * Run the command (inheriting stdio) and exit with an error if it fails.
 * @param {string} command
 * @param {string[]} args
 */
function runCommand(command, args) {
  console.log(`Running: ${command} ${args.join(' ')}`);

  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
  });

  if (result.error) {
    console.error(`Error running ${command}: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`Error running command (see above for details)`);
    process.exit(result.status);
  }
}

module.exports = runCommand;
