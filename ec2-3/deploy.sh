#!/bin/bash
# ─────────────────────────────────────────────────────────────
# EC2-3 deployment script
# Pulls latest images from DockerHub and restarts containers.
# Run this on EC2-3 after pushing new images.
# ─────────────────────────────────────────────────────────────
set -e

cd "$(dirname "$0")"

echo "=== Pulling latest images ==="
sudo docker compose pull

echo "=== Restarting containers ==="
sudo docker compose up -d --remove-orphans

echo "=== Status ==="
sudo docker compose ps
