# ClosetAI

**DeveloperWeek 2026 Hackathon** — AI-powered personal stylist that helps you stay fashionable without constant shopping and reduces decision fatigue.

## Real-World Impact

ClosetAI is grounded in peer-reviewed research and industry data:

| Impact | Evidence |
|--------|----------|
| **Stay fashionable without constant shopping** | Addressing fit, occasion, and style could mitigate up to **80%** of low usage issues (Torrens University 2025). Clothing utilisation has declined by **33%** in 15 years (PLATE2025). Personal factors explain **80%** of variance in sustainable clothing use (Cleaner & Responsible Consumption 2024). |
| **Reduce decision fatigue** | **70%** of online fashion shoppers abandon carts due to overwhelm (Capital One 2025). AI personalization can reduce returns by **10–20%** and lift conversion by **20–40%** (RSM/Accenture 2025). AI-driven recommendations significantly reduce cognitive load (Journal of Retailing and Consumer Services 2025). |

See [docs/HACK_IMPACT.md](docs/HACK_IMPACT.md) for the full research synthesis and references.

## Akamai (Linode) GPU Deployment

Deploy ClosetAI on Akamai's Linode with GPU acceleration for AI workloads. See [docs/AKAMAI_DEPLOYMENT.md](docs/AKAMAI_DEPLOYMENT.md) for the complete guide.

---

# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## Demo: Run Locally (Hackathon Judges)

This section provides instructions for running the demo without external API keys.

### Quick Start (<10 minutes)

```bash
# Step 1: Clone and setup
git clone https://github.com/lucylow/closetai.git
cd closetai

# Step 2: Copy environment (demo mode enabled by default)
cp .env.example .env

# Step 3: Start infrastructure with Docker
docker compose -f docker-compose.demo.yml up --build

# Step 4: Run database migrations
cd backend
npm run migrate

# Step 5: Seed demo data
node scripts/seedDemo.js
```

### Demo Features

When `DEMO_MODE=true` in `.env`:

- **No external API keys required** — uses local fixtures
- **Try-on returns demo images** — no Perfect Corp API calls
- **Caption generation uses templates** — no OpenAI needed
- **Pre-seeded demo user** — demo@example.com

### Demo API Endpoints

```bash
# Get outfit suggestions
curl -X POST http://localhost:5000/api/outfits/suggest \
  -H "Content-Type: application/json" \
  -d '{"userId": "00000000-0000-0000-0000-000000000001", "occasion": "casual"}'

# Request try-on (returns fixture)
curl -X POST http://localhost:5000/api/outfits/tryon \
  -H "Content-Type: application/json" \
  -d '{"userId": "00000000-0000-0000-0000-000000000001", "itemIds": ["item-1"]}'

# Admin status (use ADMIN_TOKEN from .env)
curl -X GET http://localhost:5000/admin/status \
  -H "Authorization: Bearer dev-admin-token"
```

### Testing

```bash
# Run all tests
cd backend
npm test

# Run specific test files
npm test -- tests/seedDemo.test.js
npm test -- tests/tryon.service.test.js
```

### Project Structure

```
closetai/
├── backend/                 # Node.js/Express API
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── workers/       # BullMQ workers
│   │   └── lib/          # Utilities
│   ├── migrations/        # SQL migrations
│   ├── scripts/           # Seed & utility scripts
│   └── tests/             # Jest tests
│
├── frontend/               # React/Vite frontend
│   └── src/
│
├── docker-compose.demo.yml # Demo Docker setup
├── .env.example          # Environment template
└── README.md
```

### Environment Variables

Key variables in `.env.example`:

| Variable | Description | Default |
|----------|-------------|---------|
| DEMO_MODE | Enable demo mode (no API keys) | true |
| DATABASE_URL | PostgreSQL connection | postgres://dev:dev@localhost:5432/closetai |
| REDIS_URL | Redis connection | redis://localhost:6379 |
| ADMIN_TOKEN | Admin access token | dev-admin-token |
