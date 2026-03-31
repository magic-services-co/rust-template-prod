#!/usr/bin/env bash
#
# Magic Rust Template — full local install.
#
#   curl -fsSL https://magicservices.co/rust-template/install.sh

set -e

SCRIPT_VERSION="1.2.0"
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
SKIP_IONCUBE=0
FORCE_IONCUBE=0
MIGRATE_MYSQL=0
NO_MIGRATE_PROMPT=0
usage() {
    cat <<'EOF'
Usage: install.sh [options]

  --repo URL          Git clone URL (required if not already inside the template tree)
  --branch NAME       Git branch (default: main, or RUST_TEMPLATE_BRANCH)
  --dir PATH          Install / use this directory (default: ./rust-template when cloning)
  --docker-db         Start MariaDB in Docker and configure Laravel to use it
  --db-url URL        mysql://user:pass@host:port/database (skips --docker-db)
  --ioncube           Always try to install ionCube Loader (Debian/Ubuntu + sudo)
  --skip-ioncube      Never install ionCube Loader
  --migrate-mysql     Copy data from an existing MySQL/MariaDB into the target DB (interactive)
  --no-migrate-prompt Do not ask whether to migrate (non-interactive installs skip migration unless --migrate-mysql)
  --skip-system       Do not try to install OS packages (apt)
  --no-frontend-build Skip `npm run build` (faster; run later in frontend/)
  --help              Show this help

Environment:
  RUST_TEMPLATE_REPO   Same as --repo
  RUST_TEMPLATE_BRANCH Same as --branch
  INSTALL_IONCUBE=1     Same as --ioncube
  CI=1                  Disables interactive “migrate database?” prompt

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
        ca-certificates curl git unzip mariadb-client \
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

prompt_yes_no() {
    local prompt="$1"
    local yn yl
    read -r -p "[install] ${prompt} [y/N] " yn || return 1
    yl="$(printf '%s' "$yn" | tr '[:upper:]' '[:lower:]')"
    case "$yl" in
        y|yes) return 0 ;;
        *) return 1 ;;
    esac
}

ensure_mysql_client_tools() {
    need_cmd mysql || die "mysql client not found. On Debian/Ubuntu: sudo apt install mariadb-client"
    need_cmd mysqldump || die "mysqldump not found. On Debian/Ubuntu: sudo apt install mariadb-client"
}

# List non-system databases on a server (one name per line).
mysql_list_user_databases() {
    local host="$1" port="$2" user="$3" pass="$4"
    MYSQL_PWD="$pass" mysql -h"$host" -P"$port" -u"$user" -N -e "SHOW DATABASES" 2>/dev/null \
        | grep -v -E '^(information_schema|mysql|performance_schema|sys)$' | grep -v '^$' || true
}

mysql_test_connection() {
    local host="$1" port="$2" user="$3" pass="$4"
    MYSQL_PWD="$pass" mysql -h"$host" -P"$port" -u"$user" -N -e "SELECT 1" >/dev/null 2>&1
}

# Interactive: copy one source database into the already-configured target (replaces target contents).
maybe_migrate_mysql_into_target() {
    local do_migrate=0
    if [[ "$MIGRATE_MYSQL" -eq 1 ]]; then
        do_migrate=1
    elif [[ "$NO_MIGRATE_PROMPT" -eq 1 ]] || [[ "${CI:-}" == "true" ]] || [[ "${CI:-}" == "1" ]]; then
        return 0
    elif [[ -t 0 ]] && [[ -t 1 ]] && prompt_yes_no "Copy data from an existing MySQL/MariaDB database into this install’s target database?"; then
        do_migrate=1
    fi
    [[ "$do_migrate" -eq 1 ]] || return 0

    ensure_mysql_client_tools

    local src_host src_port src_user src_pass
    log "MySQL data migration — connect to the **source** server (old Rust Template DB, or any MySQL you want to copy from)."
    read -r -p "[install] Source MySQL host [127.0.0.1]: " src_host
    src_host="${src_host:-127.0.0.1}"
    read -r -p "[install] Source MySQL port [3306]: " src_port
    src_port="${src_port:-3306}"
    read -r -p "[install] Source MySQL user: " src_user
    [[ -n "$src_user" ]] || die "Source user is required."
    read -r -s -p "[install] Source MySQL password: " src_pass
    echo ""
    mysql_test_connection "$src_host" "$src_port" "$src_user" "$src_pass" || die "Cannot connect to source MySQL. Check host, port, user, and password."

    local -a dbs=()
    while IFS= read -r line; do
        [[ -n "$line" ]] && dbs+=("$line")
    done < <(mysql_list_user_databases "$src_host" "$src_port" "$src_user" "$src_pass")

    [[ "${#dbs[@]}" -gt 0 ]] || die "No user databases found on the source (only system schemas). Nothing to migrate."

    local src_db=""
    if [[ "${#dbs[@]}" -eq 1 ]]; then
        src_db="${dbs[0]}"
        log "Only one user database on the source: ${src_db}"
        if ! prompt_yes_no "Use this database as the copy source?"; then
            die "Migration cancelled."
        fi
    else
        log "Several user databases found on the source. Pick which one to copy **from**:"
        local i
        for i in "${!dbs[@]}"; do
            printf '  %d) %s\n' "$((i + 1))" "${dbs[$i]}"
        done
        local pick
        while true; do
            read -r -p "[install] Enter number (1-${#dbs[@]}): " pick
            if [[ "$pick" =~ ^[0-9]+$ ]] && [[ "$pick" -ge 1 ]] && [[ "$pick" -le "${#dbs[@]}" ]]; then
                src_db="${dbs[$((pick - 1))]}"
                break
            fi
            warn "Invalid choice."
        done
    fi

    if [[ "$src_host" == "$MYSQL_HOST" ]] && [[ "$src_port" == "$MYSQL_PORT" ]] && [[ "$src_db" == "$MYSQL_DATABASE" ]]; then
        die "Source and target are the same database. Pick a different target in --db-url or choose another source."
    fi

    mysql_test_connection "$MYSQL_HOST" "$MYSQL_PORT" "$MYSQL_USER" "$MYSQL_PASSWORD" || die "Cannot connect to **target** MySQL (the database configured for this install)."

    warn "This will **replace all tables** in the target database:"
    warn "  ${MYSQL_DATABASE} on ${MYSQL_HOST}:${MYSQL_PORT}"
    read -r -p "[install] Type YES to continue: " confirm
    [[ "$confirm" == "YES" ]] || die "Migration cancelled."

    log "Dumping ${src_db} from ${src_host}:${src_port} and importing into ${MYSQL_DATABASE}…"
    if ! MYSQL_PWD="$src_pass" mysqldump -h"$src_host" -P"$src_port" -u"$src_user" \
        --single-transaction --quick --routines --events --set-gtid-purged=OFF \
        "$src_db" | MYSQL_PWD="$MYSQL_PASSWORD" mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" "$MYSQL_DATABASE"; then
        die "mysqldump or mysql import failed."
    fi
    log "MySQL data migration finished."
}

backend_appears_ioncube_encoded() {
    local f="$1/backend/bootstrap/app.php"
    [[ -f "$f" ]] || return 1
    head -c 500 "$f" | grep -q 'get-loader\.ioncube\.com\|ionCube Loader\|//00[0-9a-f]\{2\}cd'
}

ioncube_loader_active() {
    php -r 'exit(extension_loaded("ionCube Loader") ? 0 : 1);' 2>/dev/null
}

ensure_ioncube_loader() {
    local root="$1"
    if [[ "$SKIP_IONCUBE" -eq 1 ]]; then
        return 0
    fi
    if [[ "${INSTALL_IONCUBE:-}" == "1" ]] || [[ "${INSTALL_IONCUBE:-}" == "true" ]]; then
        FORCE_IONCUBE=1
    fi
    if [[ "$FORCE_IONCUBE" -eq 0 ]] && ! backend_appears_ioncube_encoded "$root"; then
        log "Skipping ionCube Loader (backend does not look ionCube-encoded). Use --ioncube or INSTALL_IONCUBE=1 to install anyway."
        return 0
    fi

    if ioncube_loader_active; then
        log "ionCube Loader is already loaded for this PHP."
        return 0
    fi

    local SUDO=""
    [[ "$(id -u)" -ne 0 ]] && SUDO="sudo"

    if [[ "$(id -u)" -ne 0 ]] && ! need_cmd sudo; then
        warn "Cannot install ionCube Loader without root or sudo. Install manually: https://get-loader.ioncube.com"
        return 0
    fi

    need_cmd tar || die "tar is required to unpack ionCube Loaders."

    local php_mm ts_suffix loader_name arch_key url ext_dir full_so conf_d tmpdir
    php_mm="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
    if php -r 'exit(ZEND_THREAD_SAFE ? 0 : 1);' 2>/dev/null; then
        ts_suffix="_ts"
    else
        ts_suffix=""
    fi
    loader_name="ioncube_loader_lin_${php_mm}${ts_suffix}.so"

    case "$(uname -m)" in
        x86_64) arch_key="x86-64" ;;
        aarch64|arm64) arch_key="aarch64" ;;
        *)
            warn "ionCube automatic install: unsupported CPU $(uname -m). Install from https://get-loader.ioncube.com"
            return 0
            ;;
    esac

    url="https://downloads.ioncube.com/loader_downloads/ioncube_loaders_lin_${arch_key}.tar.gz"
    tmpdir="$(mktemp -d)"

    log "Downloading ionCube Loaders (${arch_key}) for PHP ${php_mm}…"
    if ! curl -fsSL "$url" | tar -xzf - -C "$tmpdir"; then
        rm -rf "$tmpdir"
        die "Failed to download or extract ionCube loaders."
    fi

    if [[ ! -f "$tmpdir/ioncube/$loader_name" ]]; then
        rm -rf "$tmpdir"
        die "No loader $loader_name in ionCube package (PHP ${php_mm} may be too new). See https://get-loader.ioncube.com"
    fi

    ext_dir="$(php -r 'echo rtrim(ini_get("extension_dir"), "/");')"
    if [[ -z "$ext_dir" ]]; then
        rm -rf "$tmpdir"
        die "Could not read PHP extension_dir."
    fi

    log "Installing ${loader_name} into ${ext_dir}…"
    $SUDO cp "$tmpdir/ioncube/$loader_name" "$ext_dir/$loader_name"
    rm -rf "$tmpdir"
    full_so="${ext_dir}/${loader_name}"

    conf_d=""
    if php --ini 2>/dev/null | grep -q 'Scan for additional'; then
        conf_d="$(php --ini 2>/dev/null | awk -F': ' '/Scan for additional .ini files in:/ {print $2}' | tr -d ' \r')"
    fi

    if [[ -n "$conf_d" && -d "$conf_d" ]]; then
        log "Enabling zend_extension in ${conf_d}/00-ioncube.ini (CLI)…"
        echo "zend_extension=${full_so}" | $SUDO tee "${conf_d}/00-ioncube.ini" >/dev/null
    fi

    # PHP-FPM / Apache SAPIs on Debian/Ubuntu (common on VPS behind nginx)
    local sapi php_ver
    php_ver="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
    for sapi in fpm apache2 cgi; do
        local d="/etc/php/${php_ver}/${sapi}/conf.d"
        if [[ -d "$d" ]]; then
            log "Enabling ionCube for PHP ${sapi}…"
            echo "zend_extension=${full_so}" | $SUDO tee "${d}/00-ioncube.ini" >/dev/null
        fi
    done

    if ! ioncube_loader_active; then
        warn "ionCube Loader file installed but PHP CLI still does not load it. Check php --ini, php-fpm pool, or restart services."
        return 0
    fi
    log "ionCube Loader is active for PHP $(php -r 'echo PHP_VERSION;')."
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
        --ioncube) FORCE_IONCUBE=1; shift ;;
        --skip-ioncube) SKIP_IONCUBE=1; shift ;;
        --migrate-mysql) MIGRATE_MYSQL=1; shift ;;
        --no-migrate-prompt) NO_MIGRATE_PROMPT=1; shift ;;
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
ensure_ioncube_loader "$ROOT"
if backend_appears_ioncube_encoded "$ROOT" && ! ioncube_loader_active; then
    die "This backend is ionCube-encoded but the Loader is not loaded. Install ionCube for PHP $(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;' 2>/dev/null) from https://get-loader.ioncube.com or re-run with sudo on Debian/Ubuntu."
fi

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

maybe_migrate_mysql_into_target

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

cat <<'COOLIFY'

  Coolify — replacing the **old** Rust Template
  ─────────────────────────────────────────────
  If the previous site was deployed with Coolify on this VPS:

  • In the Coolify dashboard, **remove or delete the old Rust Template
    application** (that specific app / resource — not Coolify itself). Deploy
    the new template as a **new** application so builds, env vars, and volumes
    stay clean.

  • Use the **Dockerfile** build pack (not Nixpacks) so you can install PHP
    extensions (ionCube Loader). Docs: https://coolify.io/docs — Laravel +
    Dockerfile guide: https://alexcavender.com/blog/deploy-laravel-coolify-dockerfile

  • ionCube in Docker (example with mlocati/docker-php-extension-installer):

      ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
      RUN chmod +x /usr/local/bin/install-php-extensions && install-php-extensions ioncube_loader

    If that fails, install the matching ioncube_loader_lin_X.Y.so manually
    (zend_extension= in a conf.d file), same idea as this script on Ubuntu.

  Database (Coolify MySQL or any MySQL server)
  ────────────────────────────────────────────
  • If your MySQL server has **several databases**, decide which one held the
    old Rust Template data — only migrate **that** schema.

  • Easiest on a plain VPS path: re-run this installer with **--migrate-mysql**
    or answer **yes** when asked; you can **pick the source database** from a
    list when more than one exists. That copies into the **target** database
    configured for this install (target tables are replaced — type YES to confirm).

  • On Coolify, you can instead use mysqldump from the old DB and import into
    the new app’s database, or attach the same MySQL service and point the new
    app at a **new empty** database, then import. After import, run
    php artisan migrate --force where your Laravel app runs.

COOLIFY
