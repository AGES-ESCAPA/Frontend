#!/bin/sh
# Roda no start do container (docker-entrypoint.d), antes do nginx subir.
# Gera env-config.js a partir do template + variaveis de ambiente do pod
# (populadas pelo ExternalSecret do Vault - ver apps/escapa/frontend/secrets.yaml
# no repo gitos-escapa), permitindo trocar a URL da API sem rebuildar a imagem.
set -eu

: "${VITE_API_BASE_URL:=/api/v1}"
export VITE_API_BASE_URL

envsubst '${VITE_API_BASE_URL}' \
  < /usr/share/nginx/html/env-config.js.template \
  > /usr/share/nginx/html/env-config.js
