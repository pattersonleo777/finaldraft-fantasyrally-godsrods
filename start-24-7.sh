#!/usr/bin/env bash
set -euo pipefail

# Minimal script to build and start the docker-compose services for 24/7 run
# Usage: run from repository root
# ./start-24-7.sh

echo "Building images..."
docker compose build --pull

echo "Bringing services up in detached mode..."
docker compose up -d

echo "Services started. To view logs: docker compose logs -f"
