<h1 align="center"><img src="https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/logo.svg" alt="Logo" height="100" /></h1>
<h2 align="center">Graphql For VSCode</h2>
<div align="center"><a href="https://github.com/kumarharsh/graphql-for-vscode/releases"><img src="https://img.shields.io/github/release/kumarharsh/graphql-for-vscode.svg" alt="Latest Release"></a></div>

<hr>

VSCode extension for GraphQL schema authoring & consumption.

![A preview of the extension](https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/preview.png)


## What's in the Box?
* **Go to Definition**: Just <kbd>F12</kbd> or <kbd>Ctrl</kbd>+Click on any graphql type, and you'll jump right to it's definition.
![Go to Definition](https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/goto-definition.gif)
* **Schema Validation**: The plugin also validates your schema, so that you catch errors early.
* **Autocomplete**: You also get full cross-file autocomplete support.
![Autocomplete](https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/autocomplete.gif)
* **Great Syntax Highlighting**: Now, your gql files will look as beautiful as your other code with an awesome syntax highlighter which works not just with your schema files, but also within your Javascript/Typescript files.
* **Linting**: This plugin uses a similar method as used by the [Codemirror graphql](https://github.com/graphql/codemirror-graphql) project for linting.
* **Snippets**: Some commonly used snippets are provided which help while writing mutations and queries, such as definiting types, interfaces and input types.
* Autocomplete: Uses the [@playlyfe/gql](npmjs.org/package/@playlyfe/gql) library to read your whole graphql schema definitions and provide you with autocomplete support while writing & editing your `.gql` files.

## Setting it Up
1. Ensure that you have the [@playlyfe/gql](npmjs.org/package/@playlyfe/gql) library installed and available to this plugin. If you've installed the library in a folder other than the workspace root, then add the path to the node_modules directory as a setting:
```json
{
  "graphqlForVSCode.nodePath": "ui/node_modules"
}
```

2. Ensure you have [watchman](https://facebook.github.io/watchman/docs/install.html) installed and available in your path. Watchman watches your gql files and provides up-to-date suggestions. For users on Windows, get the latest build mentioned in [this issue](https://github.com/facebook/watchman/issues/19) and add the location of `watchman.exe` to your environment path.

## Future Plans
* Improved Linting: Since graphql schemas can be written in multiple .gql files, so cross-file linting should be available. I'm not sure of the implementation as of now though.
* Tests: Figure out tests.


## Contributing
* If you have a suggestion or a problem, please open an issue.
* If you'd like to improve the extension:
  + If you've made any improvements to the extension, send a Pull Request!
  + The instructions to run the server are [here](#server)
  + The instructions to run and debug the client are [here](#hacking)

## Hacking

#### Client
If you're making changes to the client, then run `npm run watch` inside this directory,
then just press <kbd>F5</kbd> to launch the *Extension Development Host* instance of vscode. Whenever you make a change, press *Reload* to reload the EDH instance.

#### Server
If you're making changes to the server, then run `npm run watch-server` from the root directory. Then, run the client in debug mode. If you make any change in the server code, you need to reload the *Extension Development Host* instance of vscode.

## Major Contributors
* [Mayank Agarwal](github.com/Mayank1791989) - added autocomplete, goto definition, schema validation support

---

*Happy Querying!*
