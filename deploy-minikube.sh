#!/bin/bash


set -euo pipefail

DOMAIN="lostfound.com"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S="$ROOT/k8s"

for cmd in minikube kubectl; do
    if ! command -v "$cmd" &> /dev/null; then
        echo "❌ '$cmd' is not installed or not on PATH. Install it first."
        exit 1
    fi
done

echo "======================================================================"
echo "🚀 1/6  Ensuring minikube is running"
echo "======================================================================"
if minikube status --format '{{.Host}}' 2>/dev/null | grep -q "Running"; then
    echo "✅ minikube already running."
else
    echo "🟢 Starting minikube..."
    minikube start
fi

echo "======================================================================"
echo "🔌 2/6  Enabling ingress addon (installs ingress-nginx)"
echo "======================================================================"
minikube addons enable ingress

echo "⏳ Waiting for the ingress-nginx controller to become Ready..."
kubectl wait --namespace ingress-nginx \
    --for=condition=Ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=180s

echo "======================================================================"
echo "📦 3/6  Applying Kubernetes manifests"
echo "======================================================================"
if [ ! -f "$K8S/secret.yaml" ]; then
    echo "❌ $K8S/secret.yaml not found (it is gitignored — never committed)."
    echo "   Create it locally with the 6 per-service Secrets before deploying."
    exit 1
fi
kubectl apply -f "$K8S/secret.yaml"
kubectl apply -f "$K8S/Volume/"
kubectl apply -f "$K8S/Deployment/"
kubectl apply -f "$K8S/Services/"
kubectl apply -f "$K8S/ingress.yaml"

echo "======================================================================"
echo "📋 4/6  Current cluster state"
echo "======================================================================"
kubectl get pods,svc,ingress


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

echo "======================================================================"
echo "📊 6/6  Opening minikube dashboard (this blocks — press Ctrl-C to stop)"
echo "======================================================================"
minikube dashboard
