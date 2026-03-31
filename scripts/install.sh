#!/usr/bin/env bash
#
# Magic Rust Template — full local install (Laravel API + Next.js frontend).
#
# From your website (set RUST_TEMPLATE_REPO to your public Git URL, or pass --repo):
#
#   curl -fsSL https://YOURDOMAIN.com/install.sh | bash -s -- --repo https://github.com/YOU/rust-template.git
#
# Or host this file at raw.githubusercontent.com/.../scripts/install.sh and use:
#
#   curl -fsSL https://raw.githubusercontent.com/YOU/rust-template/main/scripts/install.sh | bash -s -- --repo https://github.com/YOU/rust-template.git
#
# Defaults:
#   - MySQL: use --docker-db for a local MariaDB container, or set --db-url / env MYSQL_* (see --help).
#   - Clone target: ./rust-template (override with --dir).
#
set -e

SCRIPT_VERSION="1.0.0"
DEFAULT_CLONE_DIR="rust-template"
DOCKER_MYSQL_CONTAINER="rust-template-mysql"
DOCKER_MYSQL_IMAGE="${DOCKER_MYSQL_IMAGE:-mariadb:11}"
DOCKER_MYSQL_PORT="${DOCKER_MYSQL_PORT:-3307}"
DOCKER_DB_NAME="${DOCKER_DB_NAME:-templatephp}"
DOCKER_DB_USER="${DOCKER_DB_USER:-template}"
DOCKER_DB_PASS="${DOCKER_DB_PASS:-template_secret_change_me}"

REPO_URL="${RUST_TEMPLATE_REPO:-}"
BRANCH="${RUST_TEMPLATE_BRANCH:-main}"
TARGET_DIR=""
USE_DOCKER_DB=0
DB_URL_INPUT=""
SKIP_SYSTEM=0
SKIP_FRONTEND_BUILD=0
usage() {
    cat <<'EOF'
Usage: install.sh [options]

  --repo URL          Git clone URL (required if not already inside the template tree)
  --branch NAME       Git branch (default: main, or RUST_TEMPLATE_BRANCH)
  --dir PATH          Install / use this directory (default: ./rust-template when cloning)
  --docker-db         Start MariaDB in Docker and configure Laravel to use it
  --db-url URL        mysql://user:pass@host:port/database (skips --docker-db)
  --skip-system       Do not try to install OS packages (apt)
  --no-frontend-build Skip `npm run build` (faster; run later in frontend/)
  --help              Show this help

Environment:
  RUST_TEMPLATE_REPO   Same as --repo
  RUST_TEMPLATE_BRANCH Same as --branch

Examples:
  bash scripts/install.sh --repo https://github.com/org/rust-template.git --docker-db
  curl -fsSL https://example.com/install.sh | bash -s -- --repo https://github.com/org/rust-template.git --docker-db
EOF
}

log() { printf '\033[0;32m[install]\033[0m %s\n' "$*"; }
warn() { printf '\033[0;33m[install]\033[0m %s\n' "$*" >&2; }
die() { printf '\033[0;31m[install] error:\033[0m %s\n' "$*" >&2; exit 1; }

need_cmd() { command -v "$1" >/dev/null 2>&1; }

parse_mysql_url() {
    # mysql://user:pass@host:3306/db  (password may be URL-encoded)
    local url="$1"
    [[ "$url" =~ ^mysql:// ]] || die "DATABASE_URL must start with mysql://"
    url="${url#mysql://}"
    local creds_host="${url%%@*}"
    local rest="${url#*@}"
    MYSQL_USER="${creds_host%%:*}"
    local pass_part="${creds_host#*:}"
    if [[ "$pass_part" == "$creds_host" ]]; then
        MYSQL_PASSWORD=""
    else
        MYSQL_PASSWORD="$pass_part"
    fi
    local hostport="${rest%%/*}"
    MYSQL_DATABASE="${rest#*/}"
    MYSQL_DATABASE="${MYSQL_DATABASE%%\?*}"
    if [[ "$hostport" == *:* ]]; then
        MYSQL_HOST="${hostport%%:*}"
        MYSQL_PORT="${hostport##*:}"
    else
        MYSQL_HOST="$hostport"
        MYSQL_PORT="3306"
    fi
}

php_meets_minimum() {
    local v
    v="$(php -r 'echo PHP_VERSION;' 2>/dev/null)" || return 1
    php -r 'exit(version_compare(PHP_VERSION, "8.2.0", "<") ? 1 : 0);' 2>/dev/null
}

node_meets_minimum() {
    local major
    major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null)" || return 1
    [[ "${major:-0}" -ge 20 ]]
}

ensure_debian_packages() {
    [[ "$SKIP_SYSTEM" -eq 1 ]] && return 0
    if [[ "$(id -u)" -ne 0 ]] && ! need_cmd sudo; then
        warn "Not root and sudo missing; install PHP 8.2+, extensions, git, unzip, Node 20+ yourself."
        return 0
    fi
    if ! need_cmd apt-get; then
        return 0
    fi

    local SUDO=""
    [[ "$(id -u)" -ne 0 ]] && SUDO="sudo"

    log "Installing Debian/Ubuntu packages (php-cli, mysql client libs, git, Node via NodeSource if needed)…"
    $SUDO apt-get update -qq
    $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
        ca-certificates curl git unzip \
        php-cli php-mysql php-xml php-mbstring php-curl php-zip php-bcmath php-intl php-sqlite3 \
        >/dev/null 2>&1 || {
        warn "Some apt packages failed; ensure PHP 8.2+ with pdo_mysql, mbstring, xml, curl, zip, bcmath are installed."
    }

    if ! node_meets_minimum 2>/dev/null; then
        log "Installing Node.js 20.x (NodeSource)…"
        curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO bash - >/dev/null 2>&1 || true
        $SUDO DEBIAN_FRONTEND=noninteractive apt-get install -y -qq nodejs >/dev/null 2>&1 || \
            warn "Node 20 install failed; install Node 20+ from https://nodejs.org"
    fi
}

ensure_composer() {
    if need_cmd composer; then
        return 0
    fi
    local dest="${HOME}/.local/bin"
    mkdir -p "$dest"
    if [[ -x "${dest}/composer" ]]; then
        export PATH="${dest}:${PATH}"
        return 0
    fi
    log "Installing Composer to ${dest}/composer …"
    curl -sS https://getcomposer.org/installer | php -- --install-dir="$dest" --filename=composer
    export PATH="${dest}:${PATH}"
}

start_docker_mysql() {
    need_cmd docker || die "Docker is required for --docker-db but was not found."
    if docker ps -a --format '{{.Names}}' | grep -qx "$DOCKER_MYSQL_CONTAINER"; then
        log "Starting existing container ${DOCKER_MYSQL_CONTAINER}…"
        docker start "$DOCKER_MYSQL_CONTAINER" >/dev/null
    else
        log "Creating MariaDB container ${DOCKER_MYSQL_CONTAINER} on port ${DOCKER_MYSQL_PORT}…"
        docker run -d \
            --name "$DOCKER_MYSQL_CONTAINER" \
            -p "${DOCKER_MYSQL_PORT}:3306" \
            -e "MARIADB_ROOT_PASSWORD=${DOCKER_DB_PASS}_root" \
            -e "MARIADB_DATABASE=${DOCKER_DB_NAME}" \
            -e "MARIADB_USER=${DOCKER_DB_USER}" \
            -e "MARIADB_PASSWORD=${DOCKER_DB_PASS}" \
            "$DOCKER_MYSQL_IMAGE" >/dev/null
    fi

    log "Waiting for MySQL to accept connections…"
    local i
    for i in $(seq 1 60); do
        if docker exec "$DOCKER_MYSQL_CONTAINER" mariadb-admin ping -h 127.0.0.1 -u root -p"${DOCKER_DB_PASS}_root" --silent 2>/dev/null; then
            return 0
        fi
        sleep 2
    done
    die "MySQL in Docker did not become ready in time."
}

apply_backend_db_env() {
    local backend_env="$1"
    local host="$2"
    local port="$3"
    local database="$4"
    local user="$5"
    local password="$6"

    if [[ ! -f "$backend_env" ]]; then
        die "Missing ${backend_env}"
    fi

    php -r '
        $path = $argv[1];
        $pairs = [
            "DB_CONNECTION" => "mysql",
            "DB_HOST" => $argv[2],
            "DB_PORT" => $argv[3],
            "DB_DATABASE" => $argv[4],
            "DB_USERNAME" => $argv[5],
            "DB_PASSWORD" => $argv[6],
        ];
        $lines = file($path, FILE_IGNORE_NEW_LINES) ?: [];
        $out = [];
        $seen = array_fill_keys(array_keys($pairs), false);
        foreach ($lines as $line) {
            $replaced = false;
            foreach ($pairs as $k => $v) {
                if (str_starts_with($line, $k . "=")) {
                    $out[] = $k . "=" . $v;
                    $seen[$k] = true;
                    $replaced = true;
                    break;
                }
            }
            if (!$replaced) {
                $out[] = $line;
            }
        }
        foreach ($pairs as $k => $v) {
            if (!$seen[$k]) {
                $out[] = $k . "=" . $v;
            }
        }
        file_put_contents($path, implode("\n", $out) . "\n");
    ' "$backend_env" "$host" "$port" "$database" "$user" "$password"
}

setup_backend() {
    local root="$1"
    local backend="${root}/backend"
    [[ -f "${backend}/composer.json" ]] || die "No backend/composer.json under ${root}"

    log "Composer install (backend)…"
    (cd "$backend" && composer install --no-interaction --prefer-dist)

    if [[ ! -f "${backend}/.env" ]]; then
        cp "${backend}/.env.example" "${backend}/.env"
        log "Created backend/.env from .env.example"
    fi

    php "${backend}/artisan" key:generate --force

    log "Running migrations…"
    php "${backend}/artisan" migrate --force

    log "Seeding default data (roles, settings, navigation, …)…"
    php "${backend}/artisan" db:seed --force

    log "Storage link…"
    php "${backend}/artisan" storage:link 2>/dev/null || true
}

setup_frontend() {
    local root="$1"
    local fe="${root}/frontend"
    [[ -f "${fe}/package.json" ]] || die "No frontend/package.json under ${root}"

    log "npm install (frontend)…"
    (cd "$fe" && npm install)

    if [[ ! -f "${fe}/.env" ]]; then
        cp "${fe}/.env.example" "${fe}/.env"
        log "Created frontend/.env from .env.example"
    fi

    local secret
    secret="$(openssl rand -hex 32 2>/dev/null || php -r 'echo bin2hex(random_bytes(16));')"
    if grep -qE '^NEXTAUTH_SECRET=("")?$' "${fe}/.env" 2>/dev/null; then
        tmp="${fe}/.env.install.tmp.$$"
        awk -v s="$secret" '
            /^NEXTAUTH_SECRET=/ { print "NEXTAUTH_SECRET=\"" s "\""; next }
            { print }
        ' "${fe}/.env" > "$tmp" && mv "$tmp" "${fe}/.env"
        log "Set NEXTAUTH_SECRET in frontend/.env"
    fi

    if [[ "$SKIP_FRONTEND_BUILD" -eq 0 ]]; then
        log "npm run build (frontend)…"
        (cd "$fe" && npm run build)
    else
        warn "Skipped frontend build (--no-frontend-build)."
    fi
}

resolve_project_root() {
    if [[ -n "$TARGET_DIR" ]]; then
        (cd "$TARGET_DIR" && pwd)
        return
    fi
    if [[ -f "$(pwd)/backend/composer.json" ]] && [[ -f "$(pwd)/frontend/package.json" ]]; then
        pwd
        return
    fi
    die "Could not find template root. Use --repo to clone or run from the repository root, or pass --dir."
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --repo) REPO_URL="$2"; shift 2 ;;
        --branch) BRANCH="$2"; shift 2 ;;
        --dir) TARGET_DIR="$2"; shift 2 ;;
        --docker-db) USE_DOCKER_DB=1; shift ;;
        --db-url) DB_URL_INPUT="$2"; shift 2 ;;
        --skip-system) SKIP_SYSTEM=1; shift ;;
        --no-frontend-build) SKIP_FRONTEND_BUILD=1; shift ;;
        --help|-h) usage; exit 0 ;;
        *) die "Unknown option: $1 (try --help)" ;;
    esac
done

REPO_URL="${REPO_URL:-}"
if [[ -z "$REPO_URL" ]]; then
    if [[ -n "$TARGET_DIR" ]] && [[ -f "${TARGET_DIR}/backend/composer.json" ]] && [[ -f "${TARGET_DIR}/frontend/package.json" ]]; then
        :
    elif [[ -f "$(pwd)/backend/composer.json" ]] && [[ -f "$(pwd)/frontend/package.json" ]]; then
        TARGET_DIR="$(pwd)"
    else
        die "Set --repo or RUST_TEMPLATE_REPO to your Git URL, use --dir PATH to an existing copy, or run this script from the template repository root."
    fi
else
    need_cmd git || die "git is required to clone the repository."
    CLONE_PARENT="$(pwd)"
    if [[ -z "$TARGET_DIR" ]]; then
        TARGET_DIR="${CLONE_PARENT}/${DEFAULT_CLONE_DIR}"
    fi
    if [[ -d "$TARGET_DIR/.git" ]] || [[ -f "${TARGET_DIR}/backend/composer.json" ]]; then
        log "Using existing directory: ${TARGET_DIR}"
        git -C "$TARGET_DIR" fetch origin 2>/dev/null || true
        git -C "$TARGET_DIR" checkout "$BRANCH" 2>/dev/null || git -C "$TARGET_DIR" checkout -B "$BRANCH" "origin/${BRANCH}" 2>/dev/null || true
        git -C "$TARGET_DIR" pull origin "$BRANCH" 2>/dev/null || true
    else
        log "Cloning ${REPO_URL} (branch ${BRANCH}) → ${TARGET_DIR}…"
        git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$TARGET_DIR"
    fi
fi

ROOT="$(resolve_project_root)"
log "Project root: ${ROOT} (install.sh v${SCRIPT_VERSION})"

ensure_debian_packages

need_cmd php || die "PHP CLI not found. Install PHP 8.2 or newer."
php_meets_minimum || die "PHP 8.2+ required (found: $(php -r 'echo PHP_VERSION;' 2>/dev/null || echo unknown))."

need_cmd node || die "Node.js not found. Install Node 20+ (https://nodejs.org)."
node_meets_minimum || die "Node.js 20+ required (found: $(node -v 2>/dev/null || echo unknown))."

ensure_composer
need_cmd composer || die "composer not available after install attempt."

need_cmd curl || die "curl is required."
need_cmd openssl || true

MYSQL_HOST=""
MYSQL_PORT=""
MYSQL_DATABASE=""
MYSQL_USER=""
MYSQL_PASSWORD=""

if [[ -n "$DB_URL_INPUT" ]]; then
    parse_mysql_url "$DB_URL_INPUT"
elif [[ "$USE_DOCKER_DB" -eq 1 ]]; then
    start_docker_mysql
    MYSQL_HOST="127.0.0.1"
    MYSQL_PORT="$DOCKER_MYSQL_PORT"
    MYSQL_DATABASE="$DOCKER_DB_NAME"
    MYSQL_USER="$DOCKER_DB_USER"
    MYSQL_PASSWORD="$DOCKER_DB_PASS"
else
    die "Provide a database: use --docker-db for a local Docker MariaDB, or pass --db-url mysql://user:pass@host:3306/dbname"
fi

BACKEND_ENV="${ROOT}/backend/.env"
if [[ ! -f "$BACKEND_ENV" ]]; then
    cp "${ROOT}/backend/.env.example" "$BACKEND_ENV"
fi
apply_backend_db_env "$BACKEND_ENV" "$MYSQL_HOST" "$MYSQL_PORT" "$MYSQL_DATABASE" "$MYSQL_USER" "$MYSQL_PASSWORD"

setup_backend "$ROOT"
setup_frontend "$ROOT"

cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Install finished.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Backend (Laravel):  cd ${ROOT}/backend && php artisan serve
  Frontend (Next.js): cd ${ROOT}/frontend && npm run dev

  Open the app (dev): http://localhost:3000  (API proxied; backend default http://127.0.0.1:8000)

  Configure Discord, Steam, PayNow, R2, etc. in:
    - ${ROOT}/backend/.env
    - ${ROOT}/frontend/.env

EOF

if [[ "$USE_DOCKER_DB" -eq 1 ]]; then
    cat <<EOF
  MySQL (Docker): container ${DOCKER_MYSQL_CONTAINER}, port ${DOCKER_MYSQL_PORT}
    Stop: docker stop ${DOCKER_MYSQL_CONTAINER}
    Logs: docker logs -f ${DOCKER_MYSQL_CONTAINER}

EOF
fi
