#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# build-and-push.sh  (Kubernetes edition)
# Builds every service image and pushes it to DockerHub with the
# EXACT names the k8s Deployments reference:
#     jinn2/lostfound-<service>:v1.0
#
# Usage:
#   ./build-and-push.sh              # build native arch (fine for local minikube)
#   PLATFORM=linux/amd64 ./build-and-push.sh   # cross-build if the cluster is amd64
#
# Prerequisites:
#   - Docker daemon running
#   - Logged in to DockerHub:  docker login -u jinn2
#
# After pushing, (re)deploy with:  ./deploy-minikube.sh
# (imagePullPolicy is IfNotPresent — if a node already cached v1.0, either bump
#  TAG here + in k8s/Deployment/*, or `minikube image rm <image>` first.)
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

DOCKER_USER="jinn2"
IMAGE_PREFIX="lostfound"
TAG="v1.0"                       # must match the tag in k8s/Deployment/*.yaml
PLATFORM="${PLATFORM:-}"         # empty = native arch; set e.g. linux/amd64 to cross-build
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# One entry per service: "image-suffix|source-folder"
# (logger uses stock busybox — nothing to build)
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

# ─── Build & push each service ───────────────────────────────
for entry in "${SERVICES[@]}"; do
  IFS='|' read -r name folder <<< "$entry"
  tag="${DOCKER_USER}/${IMAGE_PREFIX}-${name}:${TAG}"

  echo -e "${GREEN}── Building ${tag}${PLATFORM:+ (${PLATFORM})} ──${NC}"
  docker build ${PLATFORM:+--platform "$PLATFORM"} -t "$tag" "$ROOT/$folder/"

  echo -e "${GREEN}── Pushing ${tag} ──${NC}"
  docker push "$tag"
done

# ─── Verify the k8s Deployments reference exactly what we pushed ─
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
