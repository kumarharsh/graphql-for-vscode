#!/bin/bash
set -e
set -u

if [ "$TRAVIS_BRANCH" == "master" ]; then
  yarn semantic-release
else
  yarn vscode:prepublish
fi

