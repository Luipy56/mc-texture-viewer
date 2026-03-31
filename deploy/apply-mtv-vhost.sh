#!/usr/bin/env bash
# Aplica vhost mtv.ldeluipy.es y emite certificado Let's Encrypt.
# Ejecutar en el servidor: sudo ./deploy/apply-mtv-vhost.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONF_SRC="$ROOT/deploy/apache-mtv.ldeluipy.es.conf"
AVAIL="/etc/apache2/sites-available"
ENABLED="/etc/apache2/sites-enabled"

if [[ $(id -u) -ne 0 ]]; then
  echo "Ejecuta con sudo: sudo $0" >&2
  exit 1
fi

[[ -f "$CONF_SRC" ]] || { echo "Falta $CONF_SRC" >&2; exit 1; }
[[ -d "$ROOT" ]] || { echo "DocumentRoot inexistente: $ROOT" >&2; exit 1; }

install -m 0644 "$CONF_SRC" "$AVAIL/mtv.ldeluipy.es.conf"

a2dissite mc-texture-viewer.ldeluipy.es.conf 2>/dev/null || true
a2dissite mc-texture-viewer.ldeluipy.es-le-ssl.conf 2>/dev/null || true
a2ensite mtv.ldeluipy.es.conf

apache2ctl configtest
systemctl reload apache2

# Certbot: nuevo certificado para el host corto (DNS mtv → este servidor).
certbot --apache -d mtv.ldeluipy.es --non-interactive --agree-tos --redirect

echo "Listo. HTTPS: https://mtv.ldeluipy.es/"
