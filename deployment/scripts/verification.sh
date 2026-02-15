#!/bin/bash
# verification.sh - Run this to verify your Akamai/Linode deployment

set -e

echo "=== ClosetAI - Akamai Deployment Verification ==="
echo

# 1. Check cluster nodes
echo "1. Checking cluster nodes..."
GPU_NODES=$(kubectl get nodes -l node.kubernetes.io/instance-type=g2-gpu-rtx4000a1-m --no-headers 2>/dev/null | wc -l || echo "0")
CPU_NODES=$(kubectl get nodes --no-headers 2>/dev/null | wc -l || echo "0")
echo "   GPU nodes: $GPU_NODES"
echo "   Total nodes: $CPU_NODES"
echo

# 2. Check GPU operator
echo "2. Checking GPU operator..."
if kubectl get pods -n gpu-operator 2>/dev/null | grep -q "nvidia-device-plugin"; then
    echo "   ✓ GPU operator installed"
else
    echo "   ✗ GPU operator not found (install with: helm install -n gpu-operator --create-namespace nvidia/gpu-operator)"
fi
echo

# 3. Check GPU availability
echo "3. Testing GPU access..."
if kubectl get nodes -l node.kubernetes.io/instance-type=g2-gpu-rtx4000a1-m --no-headers 2>/dev/null | grep -q .; then
    echo "   ✓ GPU nodes present"
else
    echo "   ⚠ No GPU nodes in cluster"
fi
echo

# 4. Check object storage secret
echo "4. Checking object storage..."
if kubectl get secret -n wardrobe-stylist object-storage-credentials 2>/dev/null; then
    echo "   ✓ Object storage credentials found"
else
    echo "   ✗ Object storage credentials missing (create with kubectl create secret)"
fi
echo

# 5. Check services
echo "5. Checking services..."
for svc in wardrobe-api wardrobe-frontend gpu-processor; do
    if kubectl get svc -n wardrobe-stylist $svc 2>/dev/null; then
        echo "   ✓ $svc"
    else
        echo "   ✗ $svc"
    fi
done
echo

# 6. Check ingress
echo "6. Checking ingress..."
if kubectl get ingress -n wardrobe-stylist 2>/dev/null; then
    echo "   ✓ Ingress configured"
else
    echo "   ✗ No ingress found"
fi
echo

echo "=== Verification Complete ==="
