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

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ "$REMOTE_URL" == *rust-template-source* ]]; then
  echo "This checkout is the private source repo. Run update on a rust-template-prod install." >&2
  exit 1
fi

echo "Fetching origin/${BRANCH}…"
git fetch origin "$BRANCH"

if git show-ref --verify --quiet "refs/heads/${BRANCH}"; then
  git checkout "$BRANCH"
else
  git checkout -B "$BRANCH" "origin/${BRANCH}"
fi

# Discard local edits to shipped files (do not stash or commit them).
echo "Resetting to origin/${BRANCH}…"
git reset --hard "origin/${BRANCH}"

resolve_bin() {
  local name="$1"
  shift
  local candidate
  for candidate in "$@"; do
    if [[ -n "$candidate" && -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  candidate="$(command -v "$name" 2>/dev/null || true)"
  if [[ -n "$candidate" ]]; then
    printf '%s\n' "$candidate"
    return 0
  fi
  return 1
}

COMPOSER_BIN="$(resolve_bin composer \
  "${COMPOSER:-}" \
  "${HOME}/.local/bin/composer" \
  /root/.local/bin/composer \
  /usr/local/bin/composer \
  /usr/bin/composer \
  || true)"

if [[ -f "$ROOT/backend/composer.json" ]]; then
  if [[ -n "$COMPOSER_BIN" ]]; then
    echo "composer install (backend)…"
    (cd "$ROOT/backend" && "$COMPOSER_BIN" install --no-dev --optimize-autoloader --no-interaction)
  elif [[ -f "$ROOT/backend/vendor/autoload.php" ]]; then
    echo "composer not on PATH; shipped vendor/ is present, skipping composer install."
  else
    echo "composer is not installed (try: curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer)." >&2
    exit 1
  fi
fi

if [[ -f "$ROOT/backend/artisan" ]]; then
  echo "php artisan migrate --force…"
  (cd "$ROOT/backend" && php artisan migrate --force)
  php "$ROOT/backend/artisan" config:clear
  php "$ROOT/backend/artisan" cache:clear
fi

NPM_BIN="$(resolve_bin npm \
  "${NPM:-}" \
  /usr/local/bin/npm \
  /usr/bin/npm \
  || true)"

if [[ -f "$ROOT/frontend/package.json" ]]; then
  if [[ -z "$NPM_BIN" ]]; then
    echo "npm is not installed." >&2
    exit 1
  fi
  echo "npm ci && npm run build (frontend)…"
  (cd "$ROOT/frontend" && "$NPM_BIN" ci && "$NPM_BIN" run build)
fi

echo "Self-update finished."
