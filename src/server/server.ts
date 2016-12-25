'use strict';

import {
  IPCMessageReader, IPCMessageWriter,
  createConnection, IConnection, TextDocumentSyncKind,
  TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
  CompletionItem, CompletionItemKind,
  Definition, Location, Range, Position,
  Hover, MarkedString, Files,
  TextDocumentPositionParams,
  InitializeParams, InitializeResult, InitializeError,
  ResponseError
} from 'vscode-languageserver';

import {
  resolveModule,
  makeDiagnostic,
  mapSeverity,
  filePathToURI,
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
    .then((gqlModule): InitializeResult | ResponseError<InitializeError> => {
        gqlService = createGQLService(gqlModule, workspaceRoot);

        let result: InitializeResult = {
          capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind,
            // Tell the client that the server support code complete
            completionProvider: {
              resolveProvider: true
            },

            definitionProvider: true,
          }
        };

        return result;
    })
  );
});

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

  return new gqlModule.GQL({
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

  const defPosition = gqlService.getDef(
    documents.get(textDocumentPosition.textDocument.uri).getText(),
    {
      line: textDocumentPosition.position.line + 1,
      column: textDocumentPosition.position.character + 1,
    }
  );

  if (defPosition) {
    return Location.create(
      filePathToURI(defPosition.path),
      Range.create(
        Position.create(defPosition.start.line - 1, defPosition.start.column - 1),
        Position.create(defPosition.end.line - 1, defPosition.end.column - 1)
      )
    );
  }
});

// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams, token): CompletionItem[] => {
  if (token.isCancellationRequested) { return; }

  // The pass parameter contains the position of the text document in
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  const results = gqlService.autocomplete(
    documents.get(textDocumentPosition.textDocument.uri).getText(),
    {
      line: textDocumentPosition.position.line + 1,
      column: textDocumentPosition.position.character + 1,
    }
  );

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

// Listen on the connection
connection.listen();
