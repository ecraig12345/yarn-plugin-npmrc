# `yarn-plugin-auth`

This plugin implements registry authentication using settings from `.npmrc`, following the same logic as npm itself.

Pulling credentials from `.npmrc` can be helpful for repos migrating from another package manager, or for interoperability with other tools.

## Install

Usually you'll want the minified version of the plugin:

```
yarn plugin import https://raw.githubusercontent.com/ecraig12345/yarn-plugin-npmrc/v0.2.0/dist/plugin-npmrc.js
```

If you'd like a non-minified version for debugging:

```
yarn plugin import https://raw.githubusercontent.com/ecraig12345/yarn-plugin-npmrc/v0.2.0/dist/plugin-npmrc.dev.js
```

## Usage

If migrating from another package manager or yarn v1:

1. Generate credentials and save in `.npmrc` following your usual method
1. If you were using the `.npmrc` settings `registry` or `always-auth`, those must be moved to `.yarnrc.yml`: [`npmRegistryServer`](https://yarnpkg.com/configuration/yarnrc#npmRegistryServer), [`npmAlwaysAuth`](https://yarnpkg.com/configuration/yarnrc#npmAlwaysAuth), or the [scope-specific](https://yarnpkg.com/configuration/yarnrc#npmScopes) or [registry-specific](https://yarnpkg.com/configuration/yarnrc#npmRegistries) versions of those settings

In all cases:

1. Import the plugin as above
1. In your `.yarnrc.yml`, add: `npmrcAuthEnabled: true`
1. Run `yarn` or other commands

## Notes

This plugin uses [`@npmcli/config`](https://www.npmjs.com/package/@npmcli/config) to read the effective npm config: applying `process.env.NPM_CONFIG_*`, project config, user config, and global config. There are a couple limitations:

- CLI args aren't respected, since they might interfere with yarn's processing.
- `certfile` and `keyfile` aren't supported.

The versions of `@npmcli/config` and its internal `@npmcli/package-json` are patched locally (with the patches included in the plugin bundle). The main reason is to get rid of a problematic `require.resolve('node-gyp/bin/node-gyp.js')` which assumes the code is running within the `npm` package with its dependencies and isn't needed here. The patches also remove some code which isn't needed for the very simple purposes of this plugin.
