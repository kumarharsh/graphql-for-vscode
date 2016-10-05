# Graphql For VSCode

![A preview of the extension](./client/images/preview.png)

A better extension for GraphQL schema authoring in VSCode. It provides:
* Better syntax highlighting: As far as I've tested, this extension provides a more complete syntax highlighting than other plugins on VSCode, Atom and SublimeText. This plugin uses [more common scope names](https://www.sublimetext.com/docs/3/scope_naming.html#meta) so that many themes would be covered by default. Although, in some places, vscode's Dark+/Light+ supported scope classes have also been used due to a lack of better alternatives.
* Linting: This plugin uses a similar method as used by the [Codemirror graphql](https://github.com/graphql/codemirror-graphql) project for linting. Some work is needed to get more functionality into this plugin.
* Snippets: Some commonly used snippets are provided which help while writing mutations and queries, such as definiting types, interfaces and input types.
* Autocomplete: Nothing special right now. Refer to Future Plans.

## Future Plans

* Improved Linting: Since graphql schemas can be written in multiple .gql files, so cross-file linting should be available. I'm not sure of the implementation as of now though.
* Add proper autocomplete support: Related to the first point, since graphql schemas can be spread over multiple files, I need to find a good way to provide type autocompletion without decreasing performance. Also, the vscode languageserver docs lack any information around how to approach this issue. Need to look into implementations by other extensions.
* Improve Syntax Grammar: Some fields feel like they are not very optimized, such as *objectField* and *argument*.
* Tests: Figure out tests.


## Contributing

* If you have a suggestion or a problem, please open an issue.
* If you'd like to improve the extension:
  + The instructions to run the server are [here](./server/README.md)
  + The instructions to run and debug the client are [here](./client/README.md)
  + If you've made any improvements to the extension, send a Pull Request!

---

*Happy Querying!*
