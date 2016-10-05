/// <reference path="../typings/globals/graphql/index.d.ts" />
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

import { parse } from 'graphql';

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
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: documents.syncKind,
			// Tell the client that the server support code complete
			completionProvider: {
				triggerCharacters: [':', '['],
				resolveProvider: true
			}
		}
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
interface Settings {
	graphqlForVSCode: SettingsConfig;
}

// These are the example settings we defined in the client's package.json
// file
interface SettingsConfig {
	schemaPath: string;
}

// hold the schemaPath setting
let schemaPath: string;

// This fires on settings changes, as well on server activation
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings>change.settings;
	schemaPath = settings.graphqlForVSCode.schemaPath;
	// Revalidate any open text documents
	documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];
	let ast = null;
	const text = textDocument.getText();
	try {
		ast = parse(text);
	} catch (error) {
		const location = error.locations[0];

    // var pos = CodeMirror.Pos(location.line - 1, location.column);
    // var token = editor.getTokenAt(pos);
		let startLine = location.line - 1;
		let startChar = location.column - 1;
		let endLine = startLine;
		let endChar = startChar;

		diagnostics.push({
			severity: DiagnosticSeverity.Error,
			message: error.message,
			source: 'graphql.parse',
			range: {
				start: { line: startLine, character: startChar },
				end: { line: endLine, character: endChar }
			},
			code: 'syntax'
		})
	}

	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((change) => {
	// Monitored files have change in VSCode
	connection.console.log('We recevied a change event on a watched file');
});


// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	return [
		{
			label: 'Int',
			kind: CompletionItemKind.Keyword,
			data: 1
		},
		{
			label: 'Float',
			kind: CompletionItemKind.Keyword,
			data: 2,
		},
		{
			label: 'String',
			kind: CompletionItemKind.Keyword,
			data: 3,
		},
		{
			label: 'Boolean',
			kind: CompletionItemKind.Keyword,
			data: 4,
		},
		{
			label: 'ID',
			kind: CompletionItemKind.Keyword,
			data: 5,
		},
	]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	if (item.data === 1) {
		item.detail = 'Int Scalar',
		item.documentation = 'Represents a signed 32-bit integer'
	} else if (item.data === 2) {
		item.detail = 'Float Scalar',
		item.documentation = 'Represents a signed double-precision floating-point value'
	} else if (item.data === 3) {
		item.detail = 'String Scalar',
		item.documentation = 'Represents a UTF-8 character sequence'
	} else if (item.data === 4) {
		item.detail = 'Boolean Scalar',
		item.documentation = 'true or false'
	} else if (item.data === 5) {
		item.detail = 'ID Scalar',
		item.documentation = 'The ID scalar type represents a unique identifier, often used to refetch an object or as the key for a cache. The ID type is serialized in the same way as a String; however, defining it as an ID signifies that it is not intended to be human‐readable.'
	}
	return item;
});

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.text the initial full content of the document.
	connection.console.log(`${params.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.uri uniquely identifies the document.
	connection.console.log(`${params.uri} closed.`);
});
*/

// Listen on the connection
connection.listen();