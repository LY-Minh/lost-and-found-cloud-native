#!/bin/bash

# ==============================================================================
# MINIKUBE DEPLOY SCRIPT — lostfound
# Starts minikube, enables the ingress controller, applies all k8s manifests,
# prints the /etc/hosts line you need, then opens the minikube dashboard.
# ==============================================================================

# Exit on error, treat unset vars as errors, fail a pipeline if any stage fails.
set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
DOMAIN="lostfound.com"                                   # MUST match the host in k8s/ingress.yaml
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"     # repo root = folder this script lives in
K8S="$ROOT/k8s"                                          # all manifests live here

# ─── Preflight: required tools ────────────────────────────────────────────────
for cmd in minikube kubectl; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "❌ '$cmd' is not installed or not on PATH. Install it first."
        exit 1
    fi
done

# ─── 1) Start minikube (only if it isn't already running) ─────────────────────
echo "======================================================================"
echo "🚀 1/6  Ensuring minikube is running"
echo "======================================================================"
if minikube status --format '{{.Host}}' 2>/dev/null | grep -q "Running"; then
    echo "✅ minikube already running."
else
    echo "🟢 Starting minikube..."
    minikube start
fi

# ─── 2) Enable the NGINX ingress controller addon ─────────────────────────────
echo "======================================================================"
echo "🔌 2/6  Enabling ingress addon (installs ingress-nginx)"
echo "======================================================================"
minikube addons enable ingress

echo "⏳ Waiting for the ingress-nginx controller to become Ready..."
# The addon needs a moment to schedule its controller pod; wait so that applying
# the Ingress below actually gets an address.
kubectl wait --namespace ingress-nginx \
    --for=condition=Ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=180s

# ─── 3) Apply the manifests (order: config -> storage -> workloads -> routing) ─
echo "======================================================================"
echo "📦 3/6  Applying Kubernetes manifests"
echo "======================================================================"
# secret.yaml is GITIGNORED (holds credentials) — anyone cloning fresh must
# create it locally first: 6 Secrets (auth/catalog/claims/report/profile/
# feedback-secret), each with MONGO_URI + JWT_SECRET (JWT_SECRET identical
# everywhere — auth signs, the gateway verifies).
if [ ! -f "$K8S/secret.yaml" ]; then
    echo "❌ $K8S/secret.yaml not found (it is gitignored — never committed)."
    echo "   Create it locally with the 6 per-service Secrets before deploying."
    exit 1
fi
kubectl apply -f "$K8S/secret.yaml"        # Secrets first so pods can mount them
kubectl apply -f "$K8S/Volume/"            # PersistentVolume + PersistentVolumeClaim
kubectl apply -f "$K8S/Deployment/"        # Deployments (services + logger sidecar)
kubectl apply -f "$K8S/Services/"          # ClusterIP Services the Ingress targets
kubectl apply -f "$K8S/ingress.yaml"       # Public + protected Ingress objects

# ─── 4) Show what got created ─────────────────────────────────────────────────
echo "======================================================================"
echo "📋 4/6  Current cluster state"
echo "======================================================================"
kubectl get pods,svc,ingress

# NOTE: your teammates' Deployments reference per-service Secrets (auth-secret,
# catalog-secret, ...) with keys MONGO_URI + JWT_SECRET. If those Secrets don't
# exist yet, those pods will sit in CreateContainerConfigError — that's expected
# and is a Deployment/Secret wiring task, not an Ingress problem.

# ─── 5) /etc/hosts + reachability ─────────────────────────────────────────────
IP="$(minikube ip)"
echo "======================================================================"
echo "📝 5/6  Reaching $DOMAIN from your machine"
echo "======================================================================"
echo "  macOS + Docker driver (this machine): the minikube IP ($IP) is NOT"
echo "  reachable from the host. Instead:"
echo "    1. /etc/hosts needs:      127.0.0.1  $DOMAIN"
echo "    2. In a SEPARATE terminal, run and keep open:   minikube tunnel"
echo "       (prompts for sudo; binds localhost:80 -> the ingress)"
echo
echo "  Linux (or VM drivers): use the minikube IP directly instead:"
echo "        echo \"$IP  $DOMAIN\" | sudo tee -a /etc/hosts"
echo
echo "  Then test the fanout:"
echo "        curl -i http://$DOMAIN/catalog/items          # protected -> 401 without a token"
echo "        curl -i -X POST http://$DOMAIN/auth/login -H 'Content-Type: application/json' -d '{...}'   # public"
echo

# ─── 6) Open the dashboard (BLOCKS until you Ctrl-C) ──────────────────────────
echo "======================================================================"
echo "📊 6/6  Opening minikube dashboard (this blocks — press Ctrl-C to stop)"
echo "======================================================================"
minikube dashboard
