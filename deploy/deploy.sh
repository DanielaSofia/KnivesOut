#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="${APP_DIR:-/home/danilobo/ko/knivesout}"
SERVICE_NAME="${SERVICE_NAME:-knivesout.service}"
BRANCH="${BRANCH:-main}"
SKIP_PULL="${SKIP_PULL:-0}"

for argument in "$@"; do
  case "$argument" in
    --no-pull)
      SKIP_PULL=1
      ;;
    --help|-h)
      printf 'Uso: %s [--no-pull]\n' "$0"
      exit 0
      ;;
    *)
      printf 'Argumento desconhecido: %s\n' "$argument" >&2
      exit 1
      ;;
  esac
done

cd "$APP_DIR"

if [[ "$SKIP_PULL" != "1" ]]; then
  git pull --ff-only origin "$BRANCH"
fi

npm ci
npm run lint
npx prisma migrate deploy
npm run build

sudo systemctl restart "$SERVICE_NAME"
sudo systemctl is-active --quiet "$SERVICE_NAME"

printf 'Deploy concluído: %s está ativo.\n' "$SERVICE_NAME"