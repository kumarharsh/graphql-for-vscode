<h1 align="center"><img src="https://cdn.rawgit.com/kumarharsh/graphql-for-vscode/master/images/logo.svg" alt="Logo" height="100" /></h1>
<h2 align="center">Graphql For VSCode</h2>
<div align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=kumar-harsh.graphql-for-vscode">
    <img src="http://vsmarketplacebadge.apphb.com/version-short/kumar-harsh.graphql-for-vscode.svg" alt="Latest Release">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=kumar-harsh.graphql-for-vscode">
    <img src="http://vsmarketplacebadge.apphb.com/installs-short/kumar-harsh.graphql-for-vscode.svg" alt="Installs">
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=kumar-harsh.graphql-for-vscode">
    <img src="http://vsmarketplacebadge.apphb.com/rating-short/kumar-harsh.graphql-for-vscode.svg" alt="Rating">
  </a>

  <br>

  <a href="https://github.com/semantic-release/semantic-release">
    <img src="https://img.shields.io/badge/%20%20%F0%9F%9A%80-semantic--release-e10079.svg" alt="semantic-release">
  </a>
</div>

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
* **Autocomplete**: Uses the [@playlyfe/gql](https://npmjs.org/package/@playlyfe/gql) library to read your whole graphql schema definitions and provide you with autocomplete support while writing & editing your `.gql` files.

## Setting it Up
1. Ensure that you have the [@playlyfe/gql](npmjs.org/package/@playlyfe/gql) library (v2.x) installed and available to this plugin. If you've installed the library in a folder other than the workspace root, then add the path to the node_modules directory as a setting:
    ```json
    {
      "graphqlForVSCode.nodePath": "ui/node_modules"
    }
    ```

2. Ensure you have [watchman](https://facebook.github.io/watchman/docs/install.html) installed and available in your path. Watchman watches your gql files and provides up-to-date suggestions. For users on Windows, get the latest build mentioned in [this issue](https://github.com/facebook/watchman/issues/19) and add the location of `watchman.exe` to your environment path.

3. Create a .gqlconfig file (required by the `@playlyfe/gql` package). Example:
The .gqlconfig is a JSON file with only one required key: schema.files which is the path to your *.gql files relative to your workspace root.
    ```json
    /* .gqlconfig */
    {
      "schema": {
        "files": "schemas/**/*.gql"
      }
    }
    ```
    You can use the string `files: "**/*.gql"` instead if you want to find any `.gql` file recursively in the workspace dir.

4. To enable autocomplete support within your JS(X)/TS(X) files, also add these lines to your `.gqlconfig` file:
    ```json
    /* .gqlconfig */
    {
      schema: {
        files: "schemas/**/*.gql"
      },
      query: {
        files: [ /* define file paths which you'd like the gql parser to watch and give autocomplete suggestions for */
          {
            match: 'ui/src/**/*.js',
            parser: ['EmbeddedQueryParser', { startTag: 'Relay\\.QL`', endTag: '`' }],
            isRelay: true,
          },
          {
            match: 'features/**/*.feature',
            parser: ['EmbeddedQueryParser', { startTag: 'graphql request\\s+"""', endTag: '"""' }],
          },
          {
            match: 'fixtures/**/*.gql',
            parser: 'QueryParser',
          },
        ],
      },
    }

    ```

## Future Plans
* Enable autcomplete of graphql queries in JS/TS files.
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

## Changelog
* Latest changes are available on the [releases](https://github.com/kumarharsh/graphql-for-vscode/releases) page.

---

*Happy Querying!*
