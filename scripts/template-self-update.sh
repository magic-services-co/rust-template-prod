#!/usr/bin/env bash
# Pull latest template and rebuild. Intended for servers with git + Node + Composer.
# Usage: bash scripts/template-self-update.sh [BRANCH]
# Default branch from arg, else UPDATE_GIT_BRANCH env, else Production.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BRANCH="${1:-${UPDATE_GIT_BRANCH:-Production}}"

if ! command -v git >/dev/null 2>&1; then
  echo "git is not installed." >&2
  exit 1
fi

if [[ ! -d "$ROOT/.git" ]]; then
  echo "Not a git checkout (no .git). Deploy updates with your normal process instead." >&2
  exit 1
fi

echo "Fetching and merging origin/${BRANCH}…"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull origin "$BRANCH"

if [[ -f "$ROOT/backend/composer.json" ]]; then
  echo "composer install (backend)…"
  (cd "$ROOT/backend" && composer install --no-dev --optimize-autoloader --no-interaction)
fi

if [[ -f "$ROOT/backend/artisan" ]]; then
  echo "php artisan migrate --force…"
  (cd "$ROOT/backend" && php artisan migrate --force)
  php "$ROOT/backend/artisan" config:clear
  php "$ROOT/backend/artisan" cache:clear
fi

if [[ -f "$ROOT/frontend/package.json" ]]; then
  echo "npm ci && npm run build (frontend)…"
  (cd "$ROOT/frontend" && npm ci && npm run build)
fi

echo "Self-update finished."
