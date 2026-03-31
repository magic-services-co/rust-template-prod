# Rust Template (production distribution)

This repository contains the **ionCube-encoded** Laravel backend and the **unencoded** Next.js frontend.

## Requirements

- **PHP 8.2+** with extensions required by Laravel, plus **[ionCube Loader](https://get-loader.ioncube.com)** matching your PHP version (encode target used: PHP 8.3).
- **Node.js 20+** for the frontend (`npm install`, `npm run build`).
- **MySQL** (or compatible) for the API.

## Backend

The `backend/` PHP application (except `vendor/` and a few non-PHP files) is protected with ionCube. You cannot run `php artisan` or the API without installing the Loader on the server.

## Frontend

The `frontend/` directory is standard Next.js source. Copy `.env.example` to `.env` and configure as usual.

## Install script

See `scripts/install.sh` (from the open template). Point `RUST_TEMPLATE_REPO` or `--repo` at **this** repository when publishing your own docs.

