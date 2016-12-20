'use strict';

import * as semver from 'semver';

import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, IConnection,
  TextDocuments, Diagnostic,
  InitializeParams, InitializeResult, InitializeError, ResponseError,

  Location, TextDocumentPositionParams,
  BulkRegistration, TextDocumentRegistrationOptions,
  CompletionRequest, CompletionItem, CompletionItemKind,
  Definition, DefinitionRequest,
  HoverRequest, Hover, MarkedString, 
  ReferencesRequest,
} from 'vscode-languageserver';

import {
  resolveModule,
  makeDiagnostic,
  mapSeverity,
  mapLocation,
  filePathToURI,
  uriToFilePath,
  toGQLPosition,
} from './helpers';

import * as path from 'path';

const moduleName = '@playlyfe/gql';

// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let gqlService;
connection.onInitialize((params): Thenable<InitializeResult | ResponseError<InitializeError>> => {
  let initOptions: { nodePath: string } = params.initializationOptions;
  let workspaceRoot = params.rootPath;
  const nodePath = toAbsolutePath(initOptions.nodePath || '', workspaceRoot);
  
  return (
    resolveModule(moduleName, nodePath, trace) // loading gql from project
    .then((gqlModule) => {
      if (!semver.satisfies(gqlModule.version, '2.x')) {
        return Promise.reject(
          new ResponseError(
            0, 
            'Plugin requires `@playlyfe/gql v2.x`. Please upgrade the `@playlyfe/gql` package and restart vscode.',
          ),
        );
      }

      gqlService = createGQLService(gqlModule, workspaceRoot);

      let result: InitializeResult = {
        capabilities: {}, // see registerLanguages
      };

      return result;
    })
  );
});

connection.onInitialized(() => {
  registerLanguages(gqlService.getFileExtensions());
});

function registerLanguages(extensions: Array<string>) {
  console.log('[vscode] File extensions registered: ', extensions);

  let registration = BulkRegistration.create();
  let documentOptions: TextDocumentRegistrationOptions = {
    documentSelector: [{
      scheme: 'file',
      pattern: `**/*.{${extensions.join(',')}}`,
    }],
  };

  registration.add(CompletionRequest.type, documentOptions);
  registration.add(HoverRequest.type, documentOptions);
  registration.add(DefinitionRequest.type, documentOptions);
  registration.add(ReferencesRequest.type, documentOptions);

  connection.client.register(registration);
}

function toAbsolutePath(nodePath, workspaceRoot) {
  if (!path.isAbsolute(nodePath)) {
  	return path.join(workspaceRoot, nodePath);
  }
  return nodePath;
}

function trace(message: string): void {
  connection.console.info(message);
}

function createGQLService(gqlModule, workspaceRoot) {
  let lastSendDiagnostics = [];

  return new gqlModule.GQLService({
    cwd: workspaceRoot,
    onChange() {
      const errors = gqlService.status();
      const SCHEMA_FILE = '__schema__';
      const diagnosticsMap = {};
      errors.map((error) => {
        const { locations } = error;
        if (!locations) {
          // global error will be grouped under __schema__
          if (!diagnosticsMap[SCHEMA_FILE]) {
            diagnosticsMap[SCHEMA_FILE] = {
              uri: SCHEMA_FILE,
              diagnostics: [],
            }
          }
          diagnosticsMap[SCHEMA_FILE].diagnostics.push(makeDiagnostic(error, { line: 1, column: 1 }));
        } else {
          locations.forEach((loc) => {
            if (!diagnosticsMap[loc.path]) {
              diagnosticsMap[loc.path] = {
                uri: filePathToURI(loc.path),
                diagnostics: [],
              };
            }
            diagnosticsMap[loc.path].diagnostics.push(makeDiagnostic(error, loc))
          });
        }
      });

      const sendDiagnostics = [];

      // report new errors
      Object.keys(diagnosticsMap).forEach((file) => {
        sendDiagnostics.push({file, diagnostic: diagnosticsMap[file]});
        connection.sendDiagnostics(diagnosticsMap[file]);
      });

      // clear old errors
      lastSendDiagnostics.forEach(({file, diagnostic}) => {
        if (diagnosticsMap[file]) { return; } // already reported error above
        connection.sendDiagnostics({uri: diagnostic.uri, diagnostics: [] });
      });

      lastSendDiagnostics = sendDiagnostics;
    }
  });
}

connection.onDefinition((textDocumentPosition: TextDocumentPositionParams, token): Definition => {
  if (token.isCancellationRequested) { return; }

  const defLocation = gqlService.getDef({
    sourceText: documents.get(textDocumentPosition.textDocument.uri).getText(),
    sourcePath: uriToFilePath(textDocumentPosition.textDocument.uri),
    position: toGQLPosition(textDocumentPosition.position),
  });

  if (defLocation) { return mapLocation(defLocation); }
});

// show symbol info onHover
connection.onHover((textDocumentPosition: TextDocumentPositionParams, token): Hover => {
  if (token.isCancellationRequested) { return; }

  const info = gqlService.getInfo({
    sourceText: documents.get(textDocumentPosition.textDocument.uri).getText(),
    sourcePath: uriToFilePath(textDocumentPosition.textDocument.uri),
    position: toGQLPosition(textDocumentPosition.position),
  });

  if (info) {
    return {
      contents: info.contents.map((content) => ({
        language: 'graphql',
        value: content,
      })),
    };
  }
});

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams, token): CompletionItem[] => {
  if (token.isCancellationRequested) { return; }

  const results = gqlService.autocomplete({
    sourceText: documents.get(textDocumentPosition.textDocument.uri).getText(),
    sourcePath: uriToFilePath(textDocumentPosition.textDocument.uri),
    position: toGQLPosition(textDocumentPosition.position),
  });

  return results.map(({ text, type, description }) => ({
    label: text,
    detail: type,
    documentation: description,
  }));
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

// Find all references
connection.onReferences((textDocumentPosition: TextDocumentPositionParams, token): Location[] => {
  if (token.isCancellationRequested) { return; }

  const refLocations = gqlService.findRefs({
    sourceText: documents.get(textDocumentPosition.textDocument.uri).getText(),
    sourcePath: uriToFilePath(textDocumentPosition.textDocument.uri),
    position: toGQLPosition(textDocumentPosition.position),
  });

  return refLocations.map(mapLocation);
});

// Listen on the connection
connection.listen();
