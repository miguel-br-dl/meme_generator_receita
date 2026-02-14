#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo ">> Incorporando templates..."
echo "   - Gerando templates/index.json"
npm run templates:build

echo "   - Validando consistencia do indice"
npm run templates:check

echo ">> Templates incorporados com sucesso."
