import Uri from 'vscode-uri';
import { Files, DiagnosticSeverity, Diagnostic } from 'vscode-languageserver';
import * as path from 'path';

export function resolveModule(moduleName, nodePath, tracer) {
  return Files.resolve(moduleName, nodePath, nodePath, tracer).then((modulePath) => {
    const _module = require(modulePath);
    if (tracer) {
      tracer(`Module '${moduleName}' loaded from: ${modulePath}`);
    }
    return _module;
  }, (error) => {
    return Promise.reject(new Error(
      `Couldn't find module '${moduleName}' in path '${nodePath}'.`
    ))
  });
}

export function makeDiagnostic(error, location): Diagnostic {
  let startLine = location.line - 1;
  let startChar = location.column - 1;
  let endLine = startLine;
  let endChar = startChar;
  let severity;

  return {
    severity: mapSeverity(error.severity),
    message: error.message,
    source: 'graphql',
    range: {
      start: { line: startLine, character: startChar },
      end: { line: endLine, character: endChar }
    },
    code: 'syntax'
  };
}

export function mapSeverity(severity): DiagnosticSeverity {
  switch (severity) {
    case 'error' : return DiagnosticSeverity.Error;
    case 'warn': return DiagnosticSeverity.Warning;
    default: return DiagnosticSeverity.Hint;
  }
}

export function filePathToURI(path: string): string {
  return Uri.file(path).toString();
}
