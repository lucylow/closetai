# ClosetAI Helm Chart

Deploys ClosetAI backend and GPU worker to Kubernetes.

## Prerequisites

- Helm 3
- kubectl configured for your cluster
- NVIDIA device plugin (for GPU worker)

## Install

```bash
# Create namespace
kubectl create namespace closetai

# Install with values (prefer injecting secrets via kubectl or external-secrets)
helm install closetai ./ -n closetai --create-namespace \
  --set image.backend.repository=ghcr.io/yourorg/closetai-backend \
  --set image.backend.tag=sha-abc123 \
  --set image.worker.repository=ghcr.io/yourorg/closetai-worker \
  --set image.worker.tag=sha-abc123
```

## Secrets

**Never commit real secrets.** Use one of:

1. **kubectl create secret** then reference existing secret in values
2. **--set-file** for each secret key
3. **External Secrets Operator** or Sealed Secrets

Example with kubectl:

```bash
kubectl create secret generic closetai-secrets -n closetai \
  --from-literal=PERFECT_CORP_API_KEY="sk_..." \
  --from-literal=REDIS_URL="redis://redis:6379" \
  --from-literal=ADMIN_TOKEN="your-secure-token"
```

Then update the chart to use `existingSecret` instead of generating from values.

## GPU Worker

For GPU scheduling, set `nodeSelector.gpu` and `tolerations` in values:

```yaml
nodeSelector:
  gpu:
    nodepool: gpu

tolerations:
  - key: "nvidia.com/gpu"
    operator: "Exists"
    effect: "NoSchedule"
```

## Values

| Key | Description |
|-----|-------------|
| `replicaCount` | Backend replicas |
| `image.backend.repository` | Backend image |
| `image.backend.tag` | Backend tag |
| `image.worker.repository` | Worker image |
| `image.worker.tag` | Worker tag |
| `hpa.enabled` | Enable HPA for backend |
| `secrets.*` | Secret values (prefer external injection) |
