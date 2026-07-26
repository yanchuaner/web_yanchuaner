#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="${1:-$(cd "$SCRIPT_DIR/.." && pwd)}"
BUILD_DIR="$(mktemp -d /tmp/yanchuaner-build-XXXXXX)"

cleanup() {
  if [[ "${KEEP_BUILD_DIR:-false}" == "true" ]]; then
    printf 'Kept isolated build directory: %s\n' "$BUILD_DIR"
  else
    rm -rf -- "$BUILD_DIR"
  fi
}
trap cleanup EXIT

tar -C "$SOURCE_DIR" \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.tmp \
  --exclude=.env \
  --exclude=public/uploads \
  --exclude='*.db' \
  --exclude='*.db-wal' \
  --exclude='*.db-shm' \
  -cf - . | tar -C "$BUILD_DIR" -xf -

cd "$BUILD_DIR"
npm ci --no-audit --no-fund
export DATABASE_URL="file:./.tmp/build.db"
export SESSION_SECRET="isolated-build-session-secret-20260711"
export APP_URL="http://localhost:3000"
export SITE_URL="http://localhost:3000"
export SITE_NAME="燕中校友数字母港"
export NEXT_TELEMETRY_DISABLED=1
mkdir -p .tmp
npm run db:generate
npm run db:init
npm run seed
npm run release:check
npm run build

printf 'Isolated WSL build passed.\n'
