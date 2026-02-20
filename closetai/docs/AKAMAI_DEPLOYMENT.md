# Akamai (Linode) GPU Infrastructure Deployment

**ClosetAI** — AI-powered personal stylist deployed on Akamai's Cloud Computing platform (Linode) with GPU acceleration for the DeveloperWeek 2026 Hackathon.

This guide qualifies for the **NVIDIA Jetson Orin Nano Super Developer Kit** (up to 5, based on team size) and demonstrates a creative open-source solution built on Linode Kubernetes Engine (LKE).

---

## Quick Start

```bash
# 1. Create LKE cluster (Terraform)
cd deployment/terraform
cp terraform.tfvars.example terraform.tfvars  # Edit with your token
terraform init && terraform apply

# 2. Configure kubectl
export KUBECONFIG=~/Downloads/wardrobe-stylist-cluster-kubeconfig.yaml

# 3. Install GPU operator
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm install --wait -n gpu-operator --create-namespace nvidia/gpu-operator \
  --set driver.enabled=false --set toolkit.enabled=false

# 4. Build and push images (replace with your registry)
docker build -t wardrobe-stylist/frontend:latest .
docker build -t wardrobe-stylist/api:latest ./backend
docker build -t wardrobe-stylist/gpu-processor:latest ./deployment/gpu-processor

# 5. Create secrets and deploy
kubectl create secret generic object-storage-credentials -n wardrobe-stylist \
  --from-literal=access-key="$ACCESS_KEY" \
  --from-literal=secret-key="$SECRET_KEY" \
  --from-literal=endpoint="us-east-1.linodeobjects.com" \
  --from-literal=bucket="wardrobe-stylist-media"

kubectl create secret generic database-credentials -n wardrobe-stylist \
  --from-literal=host="$DB_HOST" \
  --from-literal=name="$DB_NAME" \
  --from-literal=user="$DB_USER" \
  --from-literal=password="$DB_PASSWORD"

kubectl create secret generic app-secrets -n wardrobe-stylist \
  --from-literal=jwt-secret="$JWT_SECRET" \
  --from-literal=admin-token="$ADMIN_TOKEN"

# 6. Label GPU nodes (required for GPU processor scheduling)
./deployment/scripts/label-gpu-nodes.sh

./deployment/scripts/deploy.sh
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LKE Cluster (GPU Node Pool)                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐        ┌─────────────────────────┐      │
│  │  Frontend Pod       │        │  Backend API Pod        │      │
│  │  - React SPA        │◄─────►│  - Node.js/Express      │      │
│  │  - Nginx Serving    │        │  - Business Logic       │      │
│  └─────────────────────┘        └─────────────────────────┘     │
│          │                               │                        │
│          ▼                               ▼                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           GPU-Accelerated Services                       │    │
│  │  - Clothing segmentation (SegFormer)                    │    │
│  │  - Feature extraction                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                           │                                       │
│                           ▼                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │           Linode Object Storage                          │    │
│  │  - User uploaded images  - Generated outfit photos       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
deployment/
├── terraform/           # LKE cluster + Object Storage
│   ├── main.tf
│   ├── variables.tf
│   └── terraform.tfvars.example
├── kubernetes/          # K8s manifests
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   ├── gpu-processor-deployment.yaml
│   ├── ingress.yaml
│   ├── backend-hpa.yaml
│   ├── gpu-test.yaml
│   ├── gpu-hpa.yaml
│   └── secret.yaml.example
├── gpu-processor/       # Python GPU service
│   ├── Dockerfile
│   ├── processor.py
│   └── requirements.txt
├── scripts/
│   ├── deploy.sh
│   ├── label-gpu-nodes.sh
│   ├── verification.sh
│   └── cost-tracker.sh
└── nginx.conf           # Frontend static serving
```

---

## Prerequisites

### Accounts & Tools

- **Akamai Cloud Manager**: [Sign up with $1,000 credit](https://login.linode.com/signup?promo=akm-eve-dev-hack-1000-12126-M866)
- **CLI tools**: `kubectl`, `helm`, `terraform`, `linode-cli`, `docker`

```bash
# macOS
brew install kubectl helm terraform
pip install linode-cli

# Configure Linode CLI
linode-cli configure
```

### GPU-Supported Regions

| Region    | Location   |
|-----------|------------|
| `us-ord`  | Chicago    |
| `us-sea`  | Seattle    |
| `de-fra-2`| Frankfurt  |
| `fr-par`  | Paris      |
| `jp-osa`  | Osaka      |
| `sg-sin-2`| Singapore  |

---

## Step-by-Step Deployment

### 1. Terraform Infrastructure

```bash
cd deployment/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your Linode API token

terraform init
terraform plan
terraform apply
```

Save the `kubeconfig` output and set `KUBECONFIG`. Terraform variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `linode_token` | (required) | Linode API token |
| `region` | us-sea | GPU-supported region |
| `cluster_label` | closetai-lke | LKE cluster name |
| `gpu_node_count` | 2 | GPU node pool size |
| `cpu_node_count` | 3 | CPU node pool size |
| `object_storage_expiration_days` | 30 | Object lifecycle (0=disabled) |

### 2. NVIDIA GPU Operator

```bash
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

helm install --wait --generate-name \
  -n gpu-operator --create-namespace \
  nvidia/gpu-operator \
  --version=v24.9.1 \
  --set driver.enabled=false \
  --set toolkit.enabled=false
```

### 3. Verify GPU

```bash
kubectl apply -f deployment/kubernetes/gpu-test.yaml
kubectl logs -f gpu-check-pytorch
# Expected: CUDA available: True
kubectl delete pod gpu-check-pytorch
```

### 4. Build Docker Images

```bash
# Frontend (from project root)
docker build -t wardrobe-stylist/frontend:latest .

# Backend
docker build -t wardrobe-stylist/api:latest ./backend

# GPU Processor
docker build -t wardrobe-stylist/gpu-processor:latest ./deployment/gpu-processor
```

Push to your container registry (Docker Hub, GHCR, or Linode's Container Registry).

### 5. Create Secrets

```bash
kubectl create namespace wardrobe-stylist

kubectl create secret generic object-storage-credentials \
  -n wardrobe-stylist \
  --from-literal=access-key="$ACCESS_KEY" \
  --from-literal=secret-key="$SECRET_KEY" \
  --from-literal=endpoint="us-east-1.linodeobjects.com" \
  --from-literal=bucket="wardrobe-stylist-media"
```

### 6. Install NGINX Ingress

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  -n ingress-nginx --create-namespace \
  -f - <<EOF
controller:
  service:
    type: LoadBalancer
EOF
```

### 7. Label GPU Nodes

GPU processor pods require `nodepool=gpu` on nodes. Run after cluster is ready:

```bash
./deployment/scripts/label-gpu-nodes.sh
```

### 8. Deploy Application

```bash
./deployment/scripts/deploy.sh
./deployment/scripts/verification.sh
```

### 8. Update Ingress Host

Edit `deployment/kubernetes/ingress.yaml` and replace `wardrobe-stylist.example.com` with your NodeBalancer IP or domain. Get the IP:

```bash
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

---

## GPU Processor API

The GPU processor exposes:

| Endpoint           | Method | Description                    |
|--------------------|--------|--------------------------------|
| `/health`          | GET    | Health check, GPU status       |
| `/process-clothing`| POST   | Segment clothing, extract features |
| `/generate-outfit` | POST   | Outfit combination (placeholder) |

Uses **SegFormer B2 Clothes** for semantic segmentation (hat, upper_clothes, pants, dress, etc.).

---

## Admin Endpoint (Judge-Friendly)

`GET /api/admin/status` returns queue depth, Perfect Corp credits, and last job info. Protected by `Authorization: Bearer <ADMIN_TOKEN>`.

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" https://your-backend/api/admin/status
```

Example response:

```json
{
  "perfectCorpCredits": "123",
  "lastWorkerJob": {"id": "...", "type": "image-processing", "durationMs": 3400, "state": "completed"},
  "queueDepth": 2,
  "gpuNodes": null,
  "k8sContext": "closetai-lke",
  "timestamp": "2026-02-15T..."
}
```

Perfect Corp `X-Credit-Count` is captured from API responses and stored in Redis for visibility.

---

## CI/CD (GitHub Actions)

On push to `main`, `.github/workflows/ci-cd.yml` builds backend, frontend, and GPU processor images, pushes to GHCR, and deploys to LKE.

**Required secret**: `KUBECONFIG` — base64-encoded kubeconfig:

```bash
cat ~/.kube/config | base64 -w0   # Linux
cat ~/.kube/config | base64      # macOS
```

Add to repo: Settings → Secrets and variables → Actions → New repository secret.

---

## Cost Optimization

- **$1,000 promotional credit** with signup
- GPU nodes: ~$0.52/hour each
- Run `deployment/scripts/cost-tracker.sh` daily
- Use HPA to scale GPU pods based on demand

---

## Submission Checklist (Akamai Prize)

- [ ] GitHub repo with Terraform + K8s manifests
- [ ] Demo video (2–5 min): cluster creation, GPU operator, app demo
- [ ] Deployment instructions in README
- [ ] GPU usage demonstrated in AI workloads
- [ ] Open-source models (SegFormer)

---

## Troubleshooting

**GPU not available in pod**
- Ensure pod has `nodeSelector` for GPU nodes
- Check `nvidia.com/gpu` in `kubectl describe node`
- Verify GPU operator pods: `kubectl get pods -n gpu-operator`

**Object Storage 403**
- Verify endpoint matches cluster (us-east-1, eu-central-1, ap-south-1)
- Check secret keys and bucket name

**Backend database**
- Backend expects PostgreSQL. Create `database-credentials` secret with host, name, user, password. Use Linode Managed Database or deploy Postgres in-cluster.
