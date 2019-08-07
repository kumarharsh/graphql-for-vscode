'use strict';

import {
  commands,
  languages,
  RelativePattern,
  StatusBarAlignment,
  StatusBarItem,
  TextEditor,
  ThemeColor,
  window,
  workspace,
} from 'vscode';

import { LanguageClient, State } from 'vscode-languageclient';

enum Status {
  init = 1,
  ok = 2,
  error = 3,
}

interface IStatusBarItemConfig {
  icon: string;
  tooltip: string;
  color: string;
}

const STATUS_BAR_ITEM_NAME = 'GQL';
const STATUS_BAR_UI = {
  [Status.init]: {
    icon: 'sync',
    color: 'progressBar.background',
    tooltip: 'Graphql language server is initializing.',
  },
  [Status.ok]: {
    icon: 'plug',
    color: 'statusBar.foreground',
    tooltip: 'Graphql language server is running.',
  },
  [Status.error]: {
    icon: 'stop',
    color: 'editorError.foreground',
    tooltip: 'Graphql language server is not running.',
  },
};
export default class ClientStatusBarItem {
  private _item: StatusBarItem;
  private _client: LanguageClient;
  private _disposables: Array<{ dispose: () => any }> = [];
  private _canUseRelativePattern: boolean;

  constructor(client: LanguageClient, canUseRelativePattern: boolean) {
    this._item = window.createStatusBarItem(StatusBarAlignment.Right, 0);
    this._client = client;
    this._canUseRelativePattern = canUseRelativePattern;

    this._disposables.push(this._item);
    this._disposables.push(this._addOnClickToShowOutputChannel());

    // update status bar depending on client state
    this._setStatus(Status.init);
    this._registerStatusChangeListeners();

    // update visibility of statusBarItem depending on current activeTextEditor
    this._updateVisibility(window.activeTextEditor);
    window.onDidChangeActiveTextEditor(this._updateVisibility);
  }

  public dispose() {
    this._disposables.forEach(item => {
      item.dispose();
    });
  }

  private _registerStatusChangeListeners() {
    this._client.onDidChangeState(({ oldState, newState }) => {
      if (newState === State.Running) {
        this._setStatus(Status.ok);
      } else if (newState === State.Stopped) {
        this._setStatus(Status.error);
      }
    });

    this._client.onReady().then(
      () => {
        this._setStatus(Status.ok);
      },
      () => {
        this._setStatus(Status.error);
      },
    );
  }

  private _addOnClickToShowOutputChannel() {
    const commandName = `showOutputChannel-${this._client.outputChannel.name}`;
    const disposable = commands.registerCommand(commandName, () => {
      this._client.outputChannel.show();
    });
    this._item.command = commandName;
    return disposable;
  }

  private _updateVisibility = (textEditor: TextEditor | undefined) => {
    let hide = true;

    if (textEditor) {
      const workspaceFolder = workspace.getWorkspaceFolder(
        textEditor.document.uri,
      );

      if (this._client.initializeResult && workspaceFolder) {
        // if client is initialized then show only for file extensions
        // defined in .gqlconfig
        // @TODO: if possible, match against patterns defined in .gqlconfig
        // instead of extensions.
        const extensions = this._client.initializeResult.fileExtensions;
        const pattern = `**/*.{${extensions.join(',')}}`;
        const score = languages.match(
          {
            scheme: 'file',
            pattern: this._canUseRelativePattern
              ? new RelativePattern(workspaceFolder, pattern)
              : pattern,
          },
          textEditor.document,
        );

        hide = score === 0;
      } else {
        // while server is initializing show status bar item
        // for all files inside worspace
        hide = false;
      }
    }

    hide ? this._hide() : this._show();
  };

  private _show() {
    this._item.show();
  }

  private _hide() {
    this._item.hide();
  }

  private _setStatus(status: Status) {
    const ui: IStatusBarItemConfig = STATUS_BAR_UI[status];
    this._item.text = `$(${ui.icon}) ${STATUS_BAR_ITEM_NAME}`;
    this._item.tooltip = ui.tooltip;
    this._item.color = new ThemeColor(ui.color);
  }
}
