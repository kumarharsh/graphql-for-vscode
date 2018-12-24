/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';
import {
  commands,
  ExtensionContext,
  StatusBarAlignment,
  TextEditor,
  window,
  workspace,
} from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  NotificationType,
  ServerOptions,
  State as ClientState,
  TransportKind,
} from 'vscode-languageclient';

import { commonNotifications } from '../server/helpers';

enum Status {
  init = 1,
  ok = 2,
  error = 3,
}
const extName = 'graphqlForVSCode';
const statusBarText = 'GQL';
const statusBarUIElements = {
  [Status.init]: {
    icon: 'sync',
    color: 'yellow',
    tooltip: 'Graphql language server is initializing',
  },
  [Status.ok]: {
    icon: 'plug',
    color: 'white',
    tooltip: 'Graphql language server is running',
  },
  [Status.error]: {
    icon: 'stop',
    color: 'red',
    tooltip: 'Graphql language server has stopped',
  },
};
const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 0);
let extensionStatus: Status = Status.ok;
let serverRunning: boolean = false;
const statusBarActivationLanguageIds = [
  'graphql',
  'javascript',
  'javascriptreact',
  'typescript',
  'typescriptreact',
  'vue',
  'feature',
  'ruby',
  'ocaml',
  'reason',
];

export function activate(context: ExtensionContext) {

  // The server is implemented in node
  const serverModule = context.asAbsolutePath(path.join('out', 'server', 'server.js'));
  // The debug options for the server
  const debugOptions = { execArgv: ['--nolazy', '--debug=6004'] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run : { module: serverModule, transport: TransportKind.ipc },
    debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: 'graphql',
    initializationOptions: () => {
      const configuration = workspace.getConfiguration(extName);
      return {
        nodePath: configuration ? configuration.get('nodePath', undefined) : undefined,
        debug: configuration ? configuration.get('debug', false) : false,
      };
    },
    initializationFailedHandler: (error) => {
      window.showErrorMessage("VSCode for Graphql couldn't start. See output channel for more details.");
      client.error('Server initialization failed:', error.message);
      client.outputChannel.show(true);
      return false;
    },
  };

  // Create the language client and start the client.
  const client = new LanguageClient('Graphql For VSCode', serverOptions, clientOptions);

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(
    client.start(),
    commands.registerCommand('graphqlForVSCode.showOutputChannel', () => { client.outputChannel.show(true); }),
    statusBarItem,
  );

  client.onReady().then(() => {
    initializeStatusBar(context, client);
  });
}

const serverInitialized = new NotificationType(commonNotifications.serverInitialized);
const serverExited = new NotificationType(commonNotifications.serverExited);

function initializeStatusBar(context, client) {
  extensionStatus = Status.init;
  client.onNotification(serverInitialized, (params) => {
    extensionStatus = Status.ok;
    serverRunning = true;
    updateStatusBar(window.activeTextEditor);
  });
  client.onNotification(serverExited, (params) => {
    extensionStatus = Status.error;
    serverRunning = false;
    updateStatusBar(window.activeTextEditor);
  });

  client.onDidChangeState((event) => {
    if (event.newState === ClientState.Running) {
      extensionStatus = Status.ok;
      serverRunning = true;
    } else {
      extensionStatus = Status.error;
      client.info('The graphql server has stopped');
      serverRunning = false;
    }
    updateStatusBar(window.activeTextEditor);
  });
  window.onDidChangeActiveTextEditor((editor: TextEditor) => {
    // update the status if the server is running
    updateStatusBar(editor);
  });
  updateStatusBar(window.activeTextEditor);
}

function updateStatusBar(editor: TextEditor) {
  extensionStatus = serverRunning ? Status.ok : Status.error;
  const statusUI = statusBarUIElements[extensionStatus];
  statusBarItem.text = `$(${statusUI.icon}) ${statusBarText}`;
  statusBarItem.tooltip = statusUI.tooltip;
  statusBarItem.command = 'graphqlForVSCode.showOutputChannel';
  statusBarItem.color = statusUI.color;

  if (editor && statusBarActivationLanguageIds.indexOf(editor.document.languageId) > -1) {
    statusBarItem.show();
  } else {
    statusBarItem.hide();
  }
}
