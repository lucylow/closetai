#!/bin/bash
# deploy.sh - Deploy ClosetAI to Akamai/Linode LKE
# Prerequisites: kubectl configured, Docker, built images

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "$SCRIPT_DIR")/kubernetes"

echo "=== ClosetAI Deployment ==="

# Create namespaces
echo "Creating namespaces..."
kubectl create namespace wardrobe-stylist 2>/dev/null || true
kubectl create namespace database 2>/dev/null || true

# Check required secrets
for secret in object-storage-credentials database-credentials app-secrets; do
    if ! kubectl get secret -n wardrobe-stylist $secret &>/dev/null; then
        echo "Missing secret: $secret"
        echo "Create with: kubectl create secret generic $secret -n wardrobe-stylist --from-literal=..."
        echo "See docs/AKAMAI_DEPLOYMENT.md for details."
        read -p "Press Enter after creating secrets, or Ctrl+C to exit..."
    fi
done

# Apply Kubernetes manifests
echo "Applying Kubernetes manifests..."
kubectl apply -f "$K8S_DIR/backend-deployment.yaml"
kubectl apply -f "$K8S_DIR/backend-hpa.yaml"
kubectl apply -f "$K8S_DIR/frontend-deployment.yaml"
kubectl apply -f "$K8S_DIR/gpu-processor-deployment.yaml"
kubectl apply -f "$K8S_DIR/ingress.yaml"
kubectl apply -f "$K8S_DIR/gpu-hpa.yaml"

echo ""
echo "Deployment complete. Run verification.sh to check status."
