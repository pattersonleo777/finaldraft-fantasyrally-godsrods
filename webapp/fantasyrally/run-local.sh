#!/usr/bin/env bash
set -euo pipefail

# Minimal script to run backend and frontend locally using .env
# Usage: copy .env.example to .env and fill in values, then run from repo root:
# ./webapp/fantasyrally/run-local.sh

ROOT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cd "$ROOT_DIR"

# Start server
cd server
# load .env from the fantasyrally directory (same folder as this script)
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
fi
if [ -d node_modules ]; then
  echo "node_modules present — skipping install"
else
  echo "node_modules missing — please run 'npm install' in webapp/fantasyrally/server' before running this script"
  exit 1
fi

nohup npm start > server.log 2>&1 &
SERVER_PID=$!
cd ../mobile-app
if [ -d node_modules ]; then
  echo "mobile-app node_modules present — skipping install"
else
  echo "mobile-app node_modules missing — please run 'npm install' in webapp/fantasyrally/mobile-app' before running this script"
  exit 1
fi

npm run dev &
FRONTEND_PID=$!

echo "Server PID: $SERVER_PID (logs: server.log)"
echo "Frontend PID: $FRONTEND_PID"
echo "To stop: kill $SERVER_PID $FRONTEND_PID" 
