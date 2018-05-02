<h1 align="center"><img src="https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/logo.png" alt="Logo" height="128" /></h1>
<h2 align="center">Graphql For VSCode</h2>
<div align="center">

  [![Latest Release](https://vsmarketplacebadge.apphb.com/version-short/kumar-harsh.graphql-for-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=kumar-harsh.graphql-for-vscode)
  [![Installs](https://vsmarketplacebadge.apphb.com/installs-short/kumar-harsh.graphql-for-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=kumar-harsh.graphql-for-vscode)
  [![Rating](https://vsmarketplacebadge.apphb.com/rating-short/kumar-harsh.graphql-for-vscode.svg)](https://marketplace.visualstudio.com/items?itemName=kumar-harsh.graphql-for-vscode)


  [![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
  [![Greenkeeper badge](https://badges.greenkeeper.io/kumarharsh/graphql-for-vscode.svg)](https://greenkeeper.io/)
</div>

<hr>

VSCode extension for GraphQL schema authoring & consumption.

![A preview of the extension](https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/preview.png)


## What's in the Box?

* **Go to Definition**: Just <kbd>F12</kbd> or <kbd>Ctrl</kbd>+Click on any graphql type, and you'll jump right to it's definition.

    ![Go to Definition](https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/goto-definition.gif)
* **Autocomplete**: Uses the [@playlyfe/gql](https://npmjs.org/package/@playlyfe/gql) library to read your whole graphql schema definitions and provide you with autocomplete support while writing & editing your `.gql` files.

  ![Autocomplete](https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/autocomplete.gif)
* **Schema Validation**: The plugin also validates your schema, so that you catch errors early.
* **Linting**: This plugin uses a similar method as used by the [Codemirror graphql](https://github.com/graphql/codemirror-graphql) project for linting.
* **Great Syntax Highlighting**: Now, your graphql queries, mutations and gql files will look as beautiful as the rest of your code with an awesome syntax highlighter. It works not just with your .gql/.graphql schema files, but also within your code - supports syntax highlighting within:
  + Javascript
  + Typescript
  + Vue
  + Ruby
  + Cucumber
  + (Submit a PR to support your language!)

* **Snippets**: Some commonly used snippets are provided which help while writing mutations and queries, such as defining types, interfaces and input types.

## Setting it Up
If you only need syntax highlighting for gql and embedded queries, then just install this plugin and you're done!

To get the more IDE-like features such as autocomplete, Go to Definition, etc, read on.

0. The configuration for the v2 is simpler and falls back to sane defaults. These are the new config options, with their significance described below.

```js
// should the plugin auto-download the gql library
// defaults to true
"graphqlForVSCode.autoDownloadGQL": true,
// if you have specifically installed the `gql` library in your project in a
// location other than `<workspaceRoot>/node_modules`, then you need to
// tell the extension the path to the library
"graphqlForVSCode.gqlPath": "${workspaceRoot}/src/ui",
// An absolute path to directory containing the `.gqlconfig` file
// Useful for more complex, monorepo-like projects
"graphqlForVSCode.configDir": "${workspaceRoot}",
// whether to use watchman for watching changes (if available in your path)
// defaults to true
"graphqlForVSCode.watchman": true,
// control the logging level - useful for debugging errors / performance
// defaults to info
"graphqlForVSCode.loglevel": "info",
```

1. This extension relies on the [@playlyfe/gql](https://npmjs.org/package/@playlyfe/gql) library. With version 2.0 of the extension, this library is set to auto-download to your home path so you don't have to worry about setting more things up.

2. This extension uses a watcher service to watch all your gql schema and query files, so that you can get live autocomplete, linting, etc. The extension now defaults to using [watchman](https://facebook.github.io/watchman/docs/install.html) *if it is already in your path*, otherwise it falls back on a node-based watcher.
> Note: If you want to use watchman on Windows, get the latest build mentioned in [this issue](https://github.com/facebook/watchman/issues/19) and add the location of `watchman.exe` to your environment path.

3. Create a .gqlconfig file in your project root (required by the `@playlyfe/gql` package).
To see the full configuration, check out the [GQL](https://github.com/Mayank1791989/gql) project's docs.
> Note: The gqlconfig file is consumed by the GQL library. With the v3.0.0 release of the GQL library, the format of the .gqlconfig file has changed. Refer to the GQL library page for details.

> Note: This extension transparently converts v2-style .gqlconfig file to the v3-style. If you face any troubles with the config, open an issue with the GQL repo.

## Future Plans
* Tests: Figure out tests.

## Contributing
* If you have a suggestion or a problem, please open an issue.
  + [syntax highlighting issue](https://github.com/kumarharsh/graphql-for-vscode/issues)
  + [language server issues](https://github.com/Mayank1791989/gql/issues)
* If you'd like to improve the extension:
  + If you've made any improvements to the extension, send a Pull Request!
  + The instructions to run and debug the client are [here](#hacking)

## Hacking

The main extension code is in the `src` directory. On making changes to the code,
press <kbd>F5</kbd> to launch the *Extension Development Host* instance of vscode. Whenever you make a change, press *Reload* to reload the EDH instance.

The language-server part of this extension has been moved to the [GQL Language Server](https://github.com/Mayank1791989/gql-language-server) library.

## Major Contributors
* [Mayank Agarwal](https://github.com/Mayank1791989) - language server implementation

## Postscript
* Changelog can be found [here](/CHANGELOG.md).
* All releases can be found on the [releases](https://github.com/kumarharsh/graphql-for-vscode/releases) page. You can also download pre-built extension packages for v1.10.2 onwards directly from there.

---

*Happy Querying!*
