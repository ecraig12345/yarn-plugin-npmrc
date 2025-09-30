// @ts-check

const { execSync } = require('child_process');
const path = require('path');

/**
 * Run the command (inheriting stdio) and exit with an error if it fails.
 * @param {string} command
 * @param {string[]} args
 */
function runCommand(command, args) {
  const commandString = `${command} ${args.join(' ')}`;
  console.log(`Running: ${commandString}`);

  try {
    execSync(commandString, {
      stdio: 'inherit',
      cwd: path.resolve(__dirname, '..'),
    });
  } catch (error) {
    console.error(`Error running ${command}: ${error instanceof Error ? error.message : String(error)}`);
    const status = error && typeof error === 'object' && 'status' in error && Number.isInteger(error.status) ? Number(error.status) : 1;
    process.exit(status);
  }
}

module.exports = runCommand;
