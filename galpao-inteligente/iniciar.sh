#!/bin/sh
cd "$(dirname "$0")"
command -v node >/dev/null || { echo "Instale o Node.js 18+: https://nodejs.org"; exit 1; }
[ -f .env ] || cp .env.example .env
(sleep 1; xdg-open http://localhost:3000 2>/dev/null || open http://localhost:3000 2>/dev/null) &
node src/server.js
