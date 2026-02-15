# Kilo Sponsor Integration

Production-grade integration for the sponsor **Kilo**, covering:

1. **Kilo Gateway (HTTP)** — OpenAI-compatible inference for text/code generation, streaming, and credit tracking
2. **Kilo Cloud Agents** — Run agents via the Kilo CLI from a Bull queue worker (PRs, builds, deploys)

## Setup

### Environment Variables

```env
KILO_API_KEY=your_kilo_api_key
KILO_GATEWAY_BASE=https://api.kilo.ai/api/gateway   # optional, has default
KILO_TIMEOUT_MS=30000                               # optional
REDIS_HOST=localhost                                # for queue + credit tracking
REDIS_PORT=6379
```

### Agent Runner (optional)

For `POST /api/kilo/run-agent`, the worker needs:

- **Redis** — Bull queue
- **Git** — to clone repos
- **Kilo CLI** — `npm i -g @kilocode/cli`

Verify: `kilo agent run --help`

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/kilo/generate` | Synchronous text generation |
| POST | `/api/kilo/generate-stream` | Streaming SSE generation |
| POST | `/api/kilo/run-agent` | Enqueue agent job (returns `jobId`) |
| GET | `/api/kilo/stats` | Badge stats + credits |
| GET | `/api/kilo/credits` | Last-seen credit count |
| GET | `/api/kilo/job/:id` | Job status and result |

## Usage Examples

### Generate text

```bash
curl -X POST http://localhost:5000/api/kilo/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Write a concise README for a wardrobe app"}'
```

### Run agent (background job)

```bash
curl -X POST http://localhost:5000/api/kilo/run-agent \
  -H "Content-Type: application/json" \
  -d '{
    "repoUrl": "https://github.com/your-org/your-repo.git",
    "agent": "apply-patch-and-pr",
    "profileEnv": {"GITHUB_TOKEN": "ghp_..."},
    "timeoutMs": 120000,
    "dryRun": false
  }'
```

### Check job status

```bash
curl http://localhost:5000/api/kilo/job/JOB_ID
```

## Dedicated Worker

By default, agent jobs are processed in the main server process. For a dedicated worker:

```bash
node backend/scripts/runKiloWorker.js
```

Or in Docker:

```dockerfile
RUN npm i -g @kilocode/cli
CMD ["node", "scripts/runKiloWorker.js"]
```

## Security Notes

- Store `KILO_API_KEY` in secrets (K8s Secret, GitHub Actions secret)
- Use least-privilege bot accounts for Cloud Agents (branch, push, open PR only)
- Agent logs and results are uploaded to object storage (Linode) for audit
