import NpmConfig from '@npmcli/config';
import { definitions, shorthands, flatten } from '@npmcli/config/lib/definitions';
import fs from 'fs';
import which from 'which';
import { throwError } from './errors';

/**
 * Read the effective npm config, with the same logic as npm: applying `process.env.NPM_CONFIG_*`,
 * project config, user config, global config.
 * @returns The loaded and validated config object
 */
export async function loadNpmrc(): Promise<NpmConfig> {
  let npmPath = '';
  try {
    npmPath = fs.realpathSync(which.sync('npm'));
  } catch {
    throwError(`Couldn't find "npm" executable to help read the config`);
  }

  const conf = new NpmConfig({
    npmPath,
    definitions,
    shorthands,
    flatten,
    // prevent arg processing
    argv: [],
  });

  // // emits log events on the process object
  // // see `proc-log` for more info
  // process.on('log', (level, ...args) => {
  //   console.log(level, ...args);
  // });

  try {
    await conf.load();
    // This returns false if there are non-auth-related validation issues, but we only care about
    // the auth-related validation here (which is thrown as an error)
    conf.validate();
  } catch (err) {
    throwError(err);
  }

  return conf;
}
