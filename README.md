# `yarn-plugin-auth`

This plugin implements registry authentication using settings from `.npmrc`, following the same logic as npm itself. (`certfile` and `keyfile` aren't supported.)

## Install

Usually you'll want the minified version of the plugin:

```
yarn plugin import https://raw.githubusercontent.com/ecraig12345/yarn-plugin-npmrc/v0.0.0/bundles/@yarnpkg/plugin-npmrc.js
```

If you'd like a non-minified version for debugging:

```
yarn plugin import https://raw.githubusercontent.com/ecraig12345/yarn-plugin-npmrc/v0.0.0/bundles/@yarnpkg/plugin-npmrc-dev.js
```

## Usage

Update `.yarnrc.yml` with the setting to enable the plugin for all registries, then run `yarn` as usual.

```yml
npmrcAuthEnabled: true
```

## Notes

This plugin uses [`@npmcli/config`](https://www.npmjs.com/package/@npmcli/config) to read the effective npm config, with the same logic as npm: applying `process.env.NPM_CONFIG_*`, project config, user config, and global config. (It does _not_ respect CLI args, since they might interfere with yarn's processing.)

The versions of `@npmcli/config` and its internal `@npmcli/package-json` are patched locally (with the patches included in the plugin bundle). The main reason is to get rid of a problematic `require.resolve('node-gyp/bin/node-gyp.js')` which assumes the code is running within the `npm` package with its dependencies and isn't needed here. The patches also remove some code which isn't needed for the very simple purposes of this plugin.
