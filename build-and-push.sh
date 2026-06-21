#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# build-and-push.sh
# Builds all service Docker images and pushes them to DockerHub.
#
# Usage:
#   ./build-and-push.sh
#
# Prerequisites:
#   - Docker daemon running
#   - Logged in to DockerHub:  docker login -u jinn2
#   - All placeholder IPs in api-gateway/nginx.conf replaced
# ═══════════════════════════════════════════════════════════════
set -e

DOCKER_USER="jinn2"
IMAGE_PREFIX="lostfound"

# ─── Service definitions ─────────────────────────────────────
# Format: "service-name|source-folder|port"
SERVICES=(
  "api-gateway|api-gateway|80"
  "auth-service|auth-service|3001"
  "catalog-service|catalog-service|3002"
  "claims-service|claims-service|3003"
  "report-service|report-service|3004"
  "profile-service|profile-service|3005"
  "feedback-service|feedback-service|3006"
)

# ─── Colours ─────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Build & Push — DockerHub: ${DOCKER_USER}/${IMAGE_PREFIX}-*${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""

# ─── Pre-flight: check for placeholder IPs in nginx.conf ─────
if grep -qE '(AUTH_SERVICE_IP|CLAIMS_SERVICE_IP|CATALOG_INSTANCE_[12]_IP|REPORT_SERVICE_IP|PROFILE_SERVICE_IP|FEEDBACK_SERVICE_IP)' api-gateway/nginx.conf 2>/dev/null; then
  echo -e "${YELLOW}⚠  WARNING: Placeholder IPs found in api-gateway/nginx.conf${NC}"
  echo -e "${YELLOW}   The api-gateway image will not route correctly until you${NC}"
  echo -e "${YELLOW}   replace them with real EC2 IPs.${NC}"
  echo -e "${YELLOW}   See the EC2 IP QUICK-REFERENCE comment in nginx.conf.${NC}"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
  fi
fi

# ─── Build & push each service ───────────────────────────────
for entry in "${SERVICES[@]}"; do
  IFS='|' read -r name folder port <<< "$entry"
  tag="${DOCKER_USER}/${IMAGE_PREFIX}-${name}:latest"

  echo -e "${GREEN}── Building ${tag} ──${NC}"
  docker build -t "$tag" "$folder/"
  echo -e "${GREEN}✓ Built ${tag}${NC}"
  echo ""

  echo -e "${GREEN}── Pushing ${tag} ──${NC}"
  docker push "$tag"
  echo -e "${GREEN}✓ Pushed ${tag}${NC}"
  echo ""
done

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  All images built and pushed successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. SSH into each EC2 instance"
echo "  2. Copy the ec2-*/ folder contents to the instance"
echo "  3. cp env-template .env  &&  fill in Atlas credentials"
echo "  4. chmod +x deploy.sh  &&  ./deploy.sh"
