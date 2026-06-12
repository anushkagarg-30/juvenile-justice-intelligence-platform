#!/bin/sh
# Point this repo at version-controlled hooks
set -e
cd "$(git rev-parse --show-toplevel)"
chmod +x .githooks/prepare-commit-msg
git config core.hooksPath .githooks
echo "Installed .githooks/prepare-commit-msg for this repository."
