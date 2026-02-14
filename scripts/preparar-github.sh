#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo ">> Preparando projeto para envio ao GitHub..."
npm run git:prepare -- "$@"
echo ">> Preparacao concluida."
