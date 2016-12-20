import Uri from 'vscode-uri';
import {
  Files,
  DiagnosticSeverity,
  Diagnostic,
  Location,
  Range,
  Position,
} from 'vscode-languageserver';

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

export function makeDiagnostic(error, position): Diagnostic {
  const startPosition = mapPosition(position);
  let severity;

  return {
    severity: mapSeverity(error.severity),
    message: error.message,
    source: 'graphql',
    range: {
      start: startPosition,
      end: startPosition,
    },
    code: 'syntax'
  };
}

// map gql location to vscode location
export function mapPosition(gqlPosition): Position {
  return Position.create(
    gqlPosition.line - 1,
    gqlPosition.column - 1,
  );
}

export function mapLocation(gqlLocation): Location {
  return Location.create(
    filePathToURI(gqlLocation.path),
    Range.create(
      mapPosition(gqlLocation.start),
      mapPosition(gqlLocation.end),
    ),
  );
}

// gql (one-based) while vscode (zero-based)
export function toGQLPosition(position: Position) {
  return {
    line: position.line + 1,
    column: position.character + 1,
  };
}

// map gql severity to vscode severity
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

export function uriToFilePath(uri: string): string {
  return Files.uriToFilePath(uri);
}
