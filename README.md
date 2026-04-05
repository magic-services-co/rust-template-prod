# Rust Template (production distribution)

This tree contains the **ionCube-encoded** Laravel backend and the **unencoded** Next.js frontend.

## Requirements

- **PHP 8.2+** with Laravel extensions and **[ionCube Loader](https://get-loader.ioncube.com)** for the same PHP major/minor used at encode time (this build used the Encoder’s PHP 8.3 target).
- **Node.js 20+** for the frontend.
- **MySQL** (or compatible).

## Blade templates

`.blade.php` files are shipped as **plain source** so Laravel can compile views. Other application PHP is ionCube-encoded.

## Re-run the build

From the **private** source repository:

`./scripts/build-ioncube-prod.sh`

## Migrating from the old Rust Template

Use `scripts/install.sh` with `--migrate-mysql` (or answer the prompt on an interactive terminal) to copy one source database into the target DB. On Coolify, remove the old application first, then deploy the new one; import MySQL data separately if not using the host install script.
