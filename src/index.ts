// NOTE: Only import types (or required yarn internals) here!
// Auth isn't needed in many cases, so we shouldn't load bigger dependencies upfront.
import type NpmConfig from '@npmcli/config';
import {
  SettingsType,
  type ConfigurationDefinitionMap,
  type Plugin,
  type ConfigurationValueMap,
} from '@yarnpkg/core';
import type { Hooks as NpmHooks } from '@yarnpkg/plugin-npm';

interface NpmrcAuthConfig {
  npmrcAuthEnabled: boolean;
}

const configurationMap: ConfigurationDefinitionMap<NpmrcAuthConfig> &
  // we don't provide any of these built-in properties; this just satisfies the plugin type later
  Partial<ConfigurationDefinitionMap<ConfigurationValueMap>> = {
  npmrcAuthEnabled: {
    description: 'Attempt to read auth info from .npmrc for all registry requests',
    type: SettingsType.BOOLEAN,
    default: false,
  },
};

const enabledPropName: keyof NpmrcAuthConfig = 'npmrcAuthEnabled';

/** Cached result of reading .npmrc */
let npmrc: NpmConfig | undefined;
let npmrcError: unknown;
let cachedHeaders: Record<string, string | undefined> = {};

/**
 * Yarn v4 doesn't respect .npmrc, so this plugin reads the token from .npmrc matching a
 * specified registry and applies it as an auth header for requests against that registry.
 */
const getNpmAuthenticationHeader: NpmHooks['getNpmAuthenticationHeader'] = async (
  currentHeader,
  registry,
  { configuration },
) => {
  if (!configuration.get(enabledPropName)) {
    return currentHeader;
  }

  // Use 'in' because we might have cached undefined
  if (registry in cachedHeaders) {
    return cachedHeaders[registry];
  }

  // This might be handled by yarn automatically, but ensure we don't repeatedly try to load the
  // .npmrc if there was an error on the first attempt and yarn doesn't exit immediately
  if (npmrcError) {
    throw npmrcError;
  }

  if (!npmrc) {
    // Delay load this since auth is irrelevant for many commands
    const { loadNpmrc } = await import('./loadNpmrc');
    try {
      npmrc = await loadNpmrc();
    } catch (err) {
      npmrcError = err;
      throw npmrcError;
    }
  }

  const credentials = npmrc.getCredentialsByURI(registry);

  if (credentials.certfile || credentials.keyfile) {
    const { throwError } = await import('./errors');
    throwError(
      `This plugin does not support certfile or keyfile auth (for registry "${registry}")`,
    );
  }

  // Follow logic from npm-registry-fetch (what npm uses internally)
  // https://github.com/npm/npm-registry-fetch/blob/a50fb07ae60005a6002a9e231a25bba9c88b1c77/lib/index.js#L236-L240
  // (yarn version for reference: https://github.com/yarnpkg/berry/blob/f6a58c2803d6572af28e118eecd10c795e1228b1/packages/plugin-npm/sources/npmHttpUtils.ts#L459)
  let newHeader: string | undefined;
  if ('token' in credentials) {
    newHeader = `Bearer ${credentials.token}`;
  } else if ('auth' in credentials) {
    newHeader = `Basic ${credentials.auth}`;
  } else {
    // Fall back to whatever logic yarn is using
    newHeader = currentHeader;
  }

  cachedHeaders[registry] = newHeader;

  return newHeader;
};

const plugin: Plugin = {
  hooks: { getNpmAuthenticationHeader },
  configuration: configurationMap,
};

export default plugin;
