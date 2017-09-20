'use strict';

import * as path from 'path';
import * as semver from 'semver';

import {
  BulkRegistration, CompletionItem, CompletionRequest,
  createConnection, Definition,
  DefinitionRequest, DidChangeTextDocumentNotification, DidCloseTextDocumentNotification,

  DidOpenTextDocumentNotification, Hover,
  HoverRequest, IConnection, InitializeResult,
  IPCMessageReader, IPCMessageWriter,
  Location, NotificationType,
  ReferencesRequest,

  ResponseError,
  TextDocumentPositionParams,
  TextDocumentRegistrationOptions,
  TextDocuments,
  TextDocumentSyncKind,
} from 'vscode-languageserver';

import {
  commonNotifications,
  filePathToURI,
  makeDiagnostic,
  mapLocation,
  resolveModule,
  toGQLPosition,

  uriToFilePath,
} from './helpers';

const moduleName = '@playlyfe/gql';

// Create a connection for the server. The connection uses Node's IPC as a transport
const connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
const documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Define server notifications to be sent to the client
const serverInitialized = new NotificationType(commonNotifications.serverInitialized);
const serverExited = new NotificationType(commonNotifications.serverExited);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let gqlService;
connection.onInitialize((params): PromiseLike<InitializeResult> => {
  const initOptions: { nodePath: string, debug: boolean } = params.initializationOptions;
  const workspaceRoot = params.rootPath;
  const nodePath = toAbsolutePath(initOptions.nodePath || '', workspaceRoot);
  const debug = initOptions.debug;

  return (
    resolveModule(moduleName, nodePath, trace) // loading gql from project
    .then((gqlModule): PromiseLike<InitializeResult> | InitializeResult => {
      if (!semver.satisfies(gqlModule.version, '2.x')) {
        connection.sendNotification(serverExited);
        return Promise.reject<InitializeResult>(
          new ResponseError(
            0,
            'Plugin requires `@playlyfe/gql v2.x`. Please upgrade the `@playlyfe/gql` package and restart vscode.',
          ),
        );
      }

      gqlService = createGQLService(gqlModule, workspaceRoot, debug);

      const result: InitializeResult = {
        capabilities: {}, // see registerLanguages
      };

      return result;
    })
  );
});

connection.onInitialized(() => {
  registerLanguages(gqlService.getFileExtensions());
});

connection.onExit(() => {
  connection.sendNotification(serverExited);
});

function registerLanguages(extensions: string[]) {
  // tslint:disable-next-line no-console
  console.info('[vscode] File extensions registered: ', extensions);

  const registration = BulkRegistration.create();
  const documentOptions: TextDocumentRegistrationOptions = {
    documentSelector: [{
      scheme: 'file',
      pattern: `**/*.{${extensions.join(',')}}`,
    }],
  };

  registration.add(DidOpenTextDocumentNotification.type, documentOptions);
  registration.add(DidChangeTextDocumentNotification.type, {
    documentSelector: documentOptions.documentSelector,
    syncKind: TextDocumentSyncKind.Full,
  });
  registration.add(DidCloseTextDocumentNotification.type, documentOptions);

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
  // tslint:disable-next-line no-console
  connection.console.info(message);
}

function createGQLService(gqlModule, workspaceRoot, debug) {
  let lastSendDiagnostics = [];
  let hasNotifiedClient = false;

  return new gqlModule.GQLService({
    cwd: workspaceRoot,
    debug,
    onChange() {
      // @todo: move this it an `onInit()` function when implemented in @playlyfe/gql
      if (gqlService._isInitialized && !hasNotifiedClient) {
        hasNotifiedClient = true;
        connection.sendNotification(serverInitialized);
      }
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
            };
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
            diagnosticsMap[loc.path].diagnostics.push(makeDiagnostic(error, loc));
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
    },
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
