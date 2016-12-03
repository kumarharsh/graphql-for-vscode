/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import { workspace, Disposable, ExtensionContext } from 'vscode';
import {
  LanguageClient, LanguageClientOptions,
  SettingMonitor, ServerOptions, TransportKind,
  ErrorHandler, ErrorAction, CloseAction,
  State as ClientState,
} from 'vscode-languageclient';
import * as path from 'path';

const extName = 'graphqlForVSCode';

export function activate(context: ExtensionContext) {

  // The server is implemented in node
  let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
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
    // Register the server for plain text documents
    documentSelector: ['graphql'],
    synchronize: {
      // Synchronize the setting section 'languageServerExample' to the server
      configurationSection: extName,
    },
    diagnosticCollectionName: 'graphql',
    initializationOptions: () => {
      const configuration = workspace.getConfiguration(extName);
      return {
        nodePath: configuration ? configuration.get('nodePath', undefined) : undefined
      };
    },
    initializationFailedHandler: (error) => {
      client.error('Server initialization failed.', error);
      client.outputChannel.show(true);
      return false;
    },
  }

  // Create the language client and start the client.
  let client = new LanguageClient('Graphql For VSCode', serverOptions, clientOptions);

  // Push the disposable to the context's subscriptions so that the
  // client can be deactivated on extension deactivation
  context.subscriptions.push(client.start());
}
