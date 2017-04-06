/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextEditor } from 'vscode';
import {
  LanguageClient, LanguageClientOptions,
  SettingMonitor, ServerOptions, TransportKind,
  ErrorHandler, ErrorAction, CloseAction, NotificationType,
  State as ClientState,
} from 'vscode-languageclient';
import * as path from 'path';

const extName = 'graphqlForVSCode';
enum Status {
  init = 0,
  ok = 1,
  error = 2,
}

export function activate(context: ExtensionContext) {

  // The server is implemented in node
  let serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'));
  // The debug options for the server
  let debugOptions = { execArgv: ["--nolazy", "--debug=6004"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run : { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
  }

  // Options to control the language client
  let serverCalledProcessExit: boolean = false;
  let defaultErrorHandler: ErrorHandler;
  let clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: 'graphql',
    initializationOptions: () => {
      const configuration = workspace.getConfiguration(extName);
      return {
        nodePath: configuration ? configuration.get('nodePath', undefined) : undefined,
        debug: configuration ? configuration.get('debug', false) : false,
      };
    },
    initializationFailedHandler: (error) => {
      client.error('Server initialization failed.', error.message);
      client.outputChannel.show(true);
      return false;
    },
    errorHandler: {
			error: (error, message, count): ErrorAction => {
				return defaultErrorHandler.error(error, message, count);
			},
			closed: (): CloseAction => {
				if (serverCalledProcessExit) {
					return CloseAction.DoNotRestart;
				}
				return defaultErrorHandler.closed();
			}
		}
  }

  // Create the language client and start the client.
  let client = new LanguageClient('Graphql For VSCode', serverOptions, clientOptions);
  // Instantiate the error handler
  defaultErrorHandler = client.createDefaultErrorHandler();

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(
    client.start(),
    commands.registerCommand('graphqlForVSCode.showOutputChannel', () => { client.outputChannel.show(); }),
  );
  client.onReady().then(function() {
    graphqlActivate(context, client);
  });
}

function graphqlActivate(context: ExtensionContext, client: LanguageClient) {
  // Instantiate status bar item on the right most side on status bar
  let statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 0);
  let graphqlStatus: Status = Status.init;
  let serverRunning: boolean = false;
  // the text to display on status bar item
  const text = 'GQL';
  // The icon of the status bar item
  const icons = {
    [Status.init]: 'sync',
    [Status.ok]: 'plug',
    [Status.error]: 'stop',
  }
  statusBarItem.text = `$(${icons[graphqlStatus]}) ${text}`;
  statusBarItem.tooltip = 'Server is initializing';
  statusBarItem.command = 'graphqlForVSCode.showOutputChannel';
  context.subscriptions.push(statusBarItem);

  function showStatusBarItem(show: boolean): void {
    if (show) {
      statusBarItem.show();
      return;
    }
    statusBarItem.hide();
  }

  function updateStatusBarColour(): void {
		switch (graphqlStatus) {
			case Status.ok:
				statusBarItem.color = undefined;
				break;
			case Status.error:
				statusBarItem.color = 'red';
				break;
		}
	}

  function updateStatusBarVisibility(editor: TextEditor): void {
		statusBarItem.text = `$(${icons[graphqlStatus]}) ${text}`;
    updateStatusBarColour();
		showStatusBarItem(editor && editor.document.languageId === 'graphql');
	}

  context.subscriptions.push(client.start());
  client.onDidChangeState((event) => {
		if (event.newState === ClientState.Running) {
			statusBarItem.tooltip = 'Graphql language server is running';
      graphqlStatus = Status.ok;
			serverRunning = true;
		} else {
			client.info('The graphql server has stopped running');
			statusBarItem.tooltip = 'Graphql language server has stopped';
      graphqlStatus = Status.error;
			serverRunning = false;
		}
		updateStatusBarVisibility(window.activeTextEditor);
	});

  window.onDidChangeActiveTextEditor((...args) => {
    if (serverRunning) { // update the status if the server is running
      graphqlStatus = Status.ok;
    }
    updateStatusBarVisibility(window.activeTextEditor);
  });
  updateStatusBarVisibility(window.activeTextEditor);
}
