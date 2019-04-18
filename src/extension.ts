'use strict';

import {
  ExtensionContext,
  window,
  workspace as Workspace,
  WorkspaceFolder,
} from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient';
import * as sysPath from 'path';

import ClientStatusBarItem from './ClientStatusBarItem';
import { findConfigFile as findGQLConfigFile } from '@playlyfe/gql-language-server';

const EXT_NAME = 'graphqlForVSCode';
const GQL_LANGUAGE_SERVER_CLI_PATH = require.resolve(
  '@playlyfe/gql-language-server/lib/bin/cli',
);

interface Client {
  dispose: () => any;
  statusBarItem: ClientStatusBarItem;
  client: LanguageClient;
}

const clients: Map<string, Client | null> = new Map();

export function activate(context: ExtensionContext) {
  createClientForWorkspaces();
  // update clients when workspaceFolderChanges
  Workspace.onDidChangeWorkspaceFolders(createClientForWorkspaces);
}

export function deactivate(): Thenable<void> {
  let promises: Thenable<void>[] = [];
  clients.forEach(client => {
    promises.push(client.dispose());
  });
  return Promise.all(promises).then(() => undefined);
}

function createClientForWorkspaces() {
  const workspaceFolders = Workspace.workspaceFolders || [];
  const workspaceFoldersIndex = {};

  workspaceFolders.forEach(folder => {
    const key = folder.uri.toString();
    if (!clients.has(key)) {
      const client = createClientForWorkspace(folder);
      console.log('adding client', key, client);
      clients.set(key, client);
    }
    workspaceFoldersIndex[key] = true;
  });

  // remove clients for removed workspace folders
  clients.forEach((client, key) => {
    // remove client
    if (!workspaceFoldersIndex[key]) {
      console.log('deleting client', key);
      clients.delete(key);
      if (client) {
        client.dispose();
      }
    }
  });
}

function createClientForWorkspace(folder: WorkspaceFolder): null | Client {
  // per workspacefolder settings
  const config = Workspace.getConfiguration(EXT_NAME, folder.uri);
  const outputChannel = window.createOutputChannel(`GraphQL - ${folder.name}`);

  const gqlconfigDir = resolvePath(config.get<string>('configDir'), folder);

  // check can activate gql plugin
  // if config found in folder then activate
  try {
    findGQLConfigFile(gqlconfigDir);
  } catch (err) {
    outputChannel.appendLine(
      `Not activating language-server for workspace folder '${
        folder.name
      }'.\n` + `Reason: ${err.message}`,
    );
    return null;
  }

  const gqlLanguageServerCliOptions = [
    `--watchman=${config.get<boolean>('watchman', true)}`,
    `--auto-download-gql=${config.get<boolean>('autoDownloadGQL')}`,
    `--config-dir=${gqlconfigDir}`,
    `--gql-path=${resolvePath(config.get('gqlPath'), folder)}`,
    `--loglevel=${config.get('loglevel')}`,
  ];

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: GQL_LANGUAGE_SERVER_CLI_PATH,
      transport: TransportKind.ipc,
      args: gqlLanguageServerCliOptions,
    },
    debug: {
      module: GQL_LANGUAGE_SERVER_CLI_PATH,
      transport: TransportKind.ipc,
      options: {
        execArgv: ['--nolazy', '--inspect=6004'],
      },
      args: gqlLanguageServerCliOptions,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    diagnosticCollectionName: 'graphql',
    initializationFailedHandler: error => {
      window.showErrorMessage(
        `Plugin 'graphql-for-vscode' couldn't start for workspace '${
          folder.name
        }'. See output channel '${folder.name}' for more details.`,
      );
      client.error('Server initialization failed:', error.message);
      client.outputChannel.show(true);
      // avoid retries
      return false;
    },
    outputChannel: outputChannel,
    workspaceFolder: folder,
  };

  // Create the language client and start the client.
  const client = new LanguageClient(
    'Graphql For VSCode',
    serverOptions,
    clientOptions,
  );

  const statusBarItem = new ClientStatusBarItem(client);

  const subscriptions = [
    client.start(),
    {
      dispose() {
        outputChannel.hide();
        outputChannel.dispose();
      },
    },
    statusBarItem,
  ];

  return {
    dispose: () => {
      subscriptions.forEach(subscription => {
        subscription.dispose();
      });
    },
    statusBarItem,
    client,
  };
}

function resolvePath(path: string, folder: WorkspaceFolder): string {
  if (sysPath.isAbsolute(path)) {
    return path;
  }

  // resolve with respect to workspace root
  return sysPath.join(folder.uri.fsPath, path);
}
