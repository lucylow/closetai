#!/bin/bash
# Label GPU nodes with nodepool=gpu so GPU processor pods can schedule.
# Run after: terraform apply && export KUBECONFIG=...
# Usage: ./label-gpu-nodes.sh

set -e

echo "Labeling GPU nodes with nodepool=gpu..."

# LKE GPU nodes typically have instance type g2-gpu-rtx4000a1-m
# Label nodes that have nvidia.com/gpu resource
for node in $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}'); do
  gpu=$(kubectl get node "$node" -o jsonpath='{.status.allocatable.nvidia\.com/gpu}' 2>/dev/null || echo "")
  if [ -n "$gpu" ] && [ "$gpu" != "0" ]; then
    kubectl label node "$node" nodepool=gpu --overwrite
    echo "  Labeled $node (nvidia.com/gpu=$gpu)"
  fi
done

echo "Done. Verify with: kubectl get nodes -l nodepool=gpu"
