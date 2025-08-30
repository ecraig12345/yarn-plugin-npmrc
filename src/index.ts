import {
  SettingsType,
  type ConfigurationDefinitionMap,
  type Plugin,
  type Hooks as CoreHooks,
  type Configuration,
} from '@yarnpkg/core';
import type { Hooks as NpmHooks } from '@yarnpkg/plugin-npm';
import fs from 'fs';
import os from 'os';
import path from 'path';

interface CustomAuthConfig {
  customAuthRegistries: string[];
  customAuthNpmrcPath: string;
  customAuthNpmrcPathCI: string;
}

const configurationMap: ConfigurationDefinitionMap<CustomAuthConfig> = {
  customAuthRegistries: {
    description: 'Partial npm registry URLs to match, e.g. yourteam.pkgs.visualstudio.com',
    type: SettingsType.STRING,
    isArray: true,
    default: null,
  },
  customAuthNpmrcPath: {
    description:
      'Required: Path to the .npmrc file with the token. ' +
      'Can be relative to the project root, absolute, or start with ~/ for relative to the home directory.',
    type: SettingsType.STRING,
    isNullable: false,
    default: null,
  },
  customAuthNpmrcPathCI: {
    description:
      'Path to the .npmrc file with the token in CI, if different from local. Same substitutions apply.',
    type: SettingsType.STRING,
    default: null,
  },
};

let projectRoot: string | undefined;
let cachedConfig: Partial<CustomAuthConfig> | undefined;
let cachedHeaders: Record<string, string | undefined> = {};

/**
 * Yarn v4 doesn't respect .npmrc, so this plugin reads the token from .npmrc matching a
 * specified registry and applies it as an auth header for requests against that registry.
 */
const npmHooks: NpmHooks & CoreHooks = {
  async validateProject(project) {
    // Misusing this hook to find the project root since the right context is available...
    projectRoot = project.cwd;
  },
  async getNpmAuthenticationHeader(currentHeader, registry, { configuration, ident }) {
    const config = getConfig(configuration);

    const registrySubstring = config.customAuthRegistries?.find((hostname) =>
      registry.startsWith(`https://${hostname}`),
    );
    if (!registrySubstring) {
      // If it's not a request for a specified registry, fall back to default logic.
      return currentHeader;
    }

    if (cachedHeaders[registrySubstring]) {
      return cachedHeaders[registrySubstring];
    }

    const npmrcPath =
      (configuration.isCI && config.customAuthNpmrcPathCI) || config.customAuthNpmrcPath;
    if (!npmrcPath) {
      reportFatalError(`Missing customAuthNpmrcPath in .yarnrc.yml`);
    }
    if (!fs.existsSync(npmrcPath)) {
      reportFatalError(`${npmrcPath} does not exist`);
    }

    const npmrcLines = fs.readFileSync(npmrcPath, 'utf8').split(/\r?\n/g);
    const authRegex = /:_(password|authToken|auth)="?([^"]+)/;
    const authLine = npmrcLines.find(
      (line) => line.includes(registrySubstring) && authRegex.test(line),
    );

    if (!authLine) {
      reportFatalError(
        `Couldn't find a token/password in ${npmrcPath} matching "${registrySubstring}". ` +
          `Have you set up npm registry auth according to your repo's instructions?`,
      );
    }

    // Extract the token type and value (we know it will match due to check above)
    const authMatch = authLine.match(authRegex) || [];
    const tokenType = authMatch[1];
    const token = authMatch[2].trim();

    let encodedToken;
    if (tokenType === 'password') {
      const decodedToken = Buffer.from(token, 'base64').toString('utf8');
      encodedToken = Buffer.from(`VssSessionToken:${decodedToken}`).toString('base64');
    } else if (tokenType === 'authToken') {
      encodedToken = Buffer.from(`VssSessionToken:${token}`).toString('base64');
    } else {
      encodedToken = token;
    }

    // This encoded value is equivalent to npmAuthIdent in .yarnrc.yml.
    // Follow that header format from the plugin-npm implementation: https://github.com/yarnpkg/berry/blob/f6a58c2803d6572af28e118eecd10c795e1228b1/packages/plugin-npm/sources/npmHttpUtils.ts#L459
    return (cachedHeaders[registrySubstring] = `Basic ${encodedToken}`);
  },
};

function getConfig(configuration: Configuration): Partial<CustomAuthConfig> {
  if (cachedConfig) return cachedConfig;

  cachedConfig = {};

  for (const key of Object.keys(configurationMap) as Array<keyof CustomAuthConfig>) {
    let value = configuration.get(key);
    if (value === null || value === undefined) {
      continue;
    }

    if (key === 'customAuthNpmrcPath' || key === 'customAuthNpmrcPathCI') {
      const strValue = value as string;
      if (strValue.startsWith('~')) {
        value = path.join(os.homedir(), strValue.slice(1));
      } else if (path.isAbsolute(strValue)) {
        value = strValue;
      } else {
        value = path.resolve(projectRoot || '', strValue);
      }
    }
    (cachedConfig as any)[key] = value;
  }

  return cachedConfig;
}

/**
 * Report a fatal error with prefix `Error getting npm registry auth token:` and exit the process.
 */
function reportFatalError(message: string): never {
  // red bold text
  console.error(
    `\n\x1b[31;1m[yarn-plugin-auth] Error getting npm registry auth token: ${message}\x1b[0m\n`,
  );
  process.exit(1);
}

const plugin: Plugin = {
  hooks: npmHooks,
};

export default plugin;
