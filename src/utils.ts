import { ExtensionContext } from 'vscode';

// NOTE same as vscode.ExtensionExecutionContext
// this const can be replaced when we drop support of vscode <=1.35
const EXTENSION_EXECUTION_CONTEXT = {
  Local: 1,
  Remote: 2,
};

export function isExtensionRunningLocally(context: ExtensionContext): boolean {
  // NOTE: executionContext is present in >=1.35 (when remote support added)
  // so using local as default value
  const executionContext =
    (context as any).executionContext || EXTENSION_EXECUTION_CONTEXT.Local;
  return executionContext === EXTENSION_EXECUTION_CONTEXT.Local;
}
