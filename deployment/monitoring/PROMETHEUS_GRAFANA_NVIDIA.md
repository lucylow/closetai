# Prometheus, Grafana & NVIDIA Device Plugin Installation

Run these from a machine with `kubectl` configured to your LKE cluster and `helm` installed.

## 1. Add Helm repos and update

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
```

## 2. Create monitoring namespace

```bash
kubectl create namespace monitoring
```

## 3. Install kube-prometheus-stack (Prometheus + Grafana + Alertmanager)

Use the included `prom-values.yaml`:

```bash
helm install prom-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring -f prom-values.yaml
```

## 4. Expose Grafana (optional)

**Port-forward (quick demo):**
```bash
kubectl port-forward -n monitoring svc/prom-stack-grafana 3000:80
# Open http://localhost:3000
```

**Get Grafana admin password:**
```bash
kubectl get secret -n monitoring prom-stack-grafana -o jsonpath="{.data.admin-password}" | base64 --decode ; echo
```

(Secret name can differ by chart version; run `kubectl get secrets -n monitoring` to find it.)

## 5. Install NVIDIA device plugin

Deploys the device plugin daemonset which advertises `nvidia.com/gpu` to the scheduler:

```bash
kubectl apply -f https://raw.githubusercontent.com/NVIDIA/k8s-device-plugin/v0.12.0/nvidia-device-plugin.yml
```

**Note:** LKE might already provision the device plugin if you used a GPU-enabled node pool.

## 6. Verify GPU resources

```bash
# Check daemonset
kubectl get ds -A | grep nvidia

# Check nodes allocatable
kubectl get nodes -o custom-columns=NAME:.metadata.name,ALLOCATABLE:.status.allocatable['nvidia.com/gpu']

# Inspect a GPU node
kubectl describe node <gpu-node-name> | grep -A3 "Allocatable"
```

If pods remain Pending, check `kubectl describe pod` for scheduling messages (insufficient GPU, plugin missing, taints).

## 7. Prometheus scraping for your apps

Ensure your backend exposes Prometheus metrics (e.g. `prom-client` in Node). Annotate the backend deployment pods:

```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "5000"
    prometheus.io/path: "/metrics"
```

The kube-prometheus-stack will auto-scrape pod endpoints annotated like this.
