# ClosetAI Local Development Stack

Redis, backend, worker, and Prometheus for local development.

## Prerequisites

- Docker and Docker Compose
- Backend `.env` or environment variables (see below)

## Quick Start

```bash
cd dev-local
# Copy .env.example to .env and fill in secrets
cp .env.example .env
# Edit .env: PERFECT_CORP_API_KEY, ADMIN_TOKEN

docker compose up --build
```

## Endpoints

| Service    | URL                    |
|-----------|------------------------|
| Backend   | http://localhost:5000  |
| Prometheus| http://localhost:9090  |

## Metrics

The backend must expose `/metrics` for Prometheus. Add `prom-client` and register these gauges:

- `closet_perfcorp_last_credits` – Perfect Corp credits
- `closet_queue_waiting`, `closet_queue_active`, `closet_queue_failed` – queue depth
- `closet_job_duration_seconds` – histogram for job timing

See the Grafana dashboard at `grafana/closetai_admin_dashboard.json` for panel queries.

## Grafana

1. Run Grafana (e.g. `docker run -d -p 3000:3000 grafana/grafana` or use kube-prometheus-stack).
2. Add Prometheus data source: `http://prometheus:9090` (from another container) or `http://host.docker.internal:9090` (from host).
3. Dashboard → Import → Upload `grafana/closetai_admin_dashboard.json`.

## References

- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)
- [NVIDIA DCGM Exporter](https://github.com/NVIDIA/dcgm-exporter) (for GPU metrics)
