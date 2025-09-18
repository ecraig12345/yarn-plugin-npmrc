# `yarn-plugin-npmrc`

This plugin implements registry authentication using settings from `.npmrc`, following most of the same logic as npm itself.

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
- Environment variable replacement only supports variables from the actual process environment, not variables that would normally be added to the environment by npm. (This should have no impact on auth-related values in most cases; the only time it might cause issues is advanced modifications to the `prefix` or config paths which are then referenced as environment variables in a config.)
- Certificate or key-based auth (`certfile`, `keyfile`) aren't supported.

The versions of `@npmcli/config` and its internal `@npmcli/package-json` are patched locally (with the patches included in the plugin bundle). The initial motivation was to get rid of a problematic `require.resolve('node-gyp/bin/node-gyp.js')` which assumes the code is running within the `npm` package with its dependencies and isn't needed here. The patches also remove some code which isn't needed for the very simple purposes of this plugin.

<details><summary>Updating the patches (expand for details)</summary>

It's cleaner to make a fresh patch directory and use `git apply` to apply previous changes, rather than running `yarn patch -u` which adds a second patch file on top of the first one.

1. Optionally, if you need to update the version of `@npmcli/config`, change its version in `package.json` from the patch to the latest registry version, and run `yarn`
1. `yarn patch @npmcli/config`
1. Open the patch directory in an editor window. In that directory:
   1. `git init` and commit all the files (optional, but it can be helpful to see the diff against the original code while editing)
   1. Copy the full path of the previous patch (under `yarn-plugin-npmrc/.yarn/patches`)
   1. Run `git apply <patch-path>` and fix any conflicts (optionally commit if you want a diff with your next changes)
   1. Make any further changes
   1. `rm -rf .git` to avoid including the temp git metadata in the patch!
1. Run the `yarn patch-commit` command from the output
1. Delete the old patch file
1. Don't forget to run `yarn` again to apply the new patch and update the lock file!

</details>
