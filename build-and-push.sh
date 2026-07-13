#!/bin/bash
set -euo pipefail

DOCKER_USER="jinn2"
IMAGE_PREFIX="lostfound"
TAG="v1.0"
PLATFORM="${PLATFORM:-}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SERVICES=(
  "api-gateway|api-gateway"
  "auth-service|auth-service"
  "catalog-service|catalog-service"
  "claims-service|claims-service"
  "report-service|report-service"
  "profile-service|profile-service"
  "feedback-service|feedback-service"
)

GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${GREEN}═══ Build & Push → DockerHub: ${DOCKER_USER}/${IMAGE_PREFIX}-*:${TAG} ═══${NC}"

for entry in "${SERVICES[@]}"; do
  IFS='|' read -r name folder <<< "$entry"
  tag="${DOCKER_USER}/${IMAGE_PREFIX}-${name}:${TAG}"

  echo -e "${GREEN}── Building ${tag}${PLATFORM:+ (${PLATFORM})} ──${NC}"
  docker build ${PLATFORM:+--platform "$PLATFORM"} -t "$tag" "$ROOT/$folder/"

  echo -e "${GREEN}── Pushing ${tag} ──${NC}"
  docker push "$tag"
done

echo -e "${GREEN}── Verifying k8s/Deployment/*.yaml image refs ──${NC}"
FAIL=0
for entry in "${SERVICES[@]}"; do
  IFS='|' read -r name folder <<< "$entry"
  tag="${DOCKER_USER}/${IMAGE_PREFIX}-${name}:${TAG}"
  if grep -rq "image: ${tag}" "$ROOT/k8s/Deployment/"; then
    echo -e "  ✓ ${tag} referenced in Deployments"
  else
    echo -e "  ${RED}✗ ${tag} NOT referenced by any Deployment — fix the image: line${NC}"
    FAIL=1
  fi
done
[ "$FAIL" -eq 0 ] && echo -e "${GREEN}All images pushed AND wired into the Deployments. Run ./deploy-minikube.sh next.${NC}"
exit $FAIL
