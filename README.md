# CloudCRM — Sales Intelligence Platform

Full-stack CRM with infrastructure management dashboard built for BTEC Unit 6 "Networking in the Cloud".

## Architecture

```
Internet :80
    │
┌───▼────┐  public subnet
│  nginx  │  Vue SPA + /api load balance + /api/control → controller
└───┬────┘
    │ private subnet
┌───┼──────────────┐
│ ┌─▼──┐  ┌──────┐ │  ┌────────────┐
│ │api×N│  │ ctrl │ │  │ PostgreSQL │
│ └──┬──┘  └──┬──┘ │  └────────────┘
│    └────────┴────┘│
└───────────────────┘
```

## Tech Stack

| Layer      | Technology |
|-----------|-----------|
| Backend   | FastAPI, SQLAlchemy, PostgreSQL, JWT |
| Frontend  | Vue 3, Vite, Pinia, Chart.js, vis-network |
| Infra     | Docker, Docker Compose, Nginx 1.27 |
| CI/CD     | GitHub Actions → GHCR → SSH deploy |

## Quick Start (Local)

```bash
docker compose up -d --build --scale api=3
```

Open http://localhost:8080

**Login:** admin@cloudcrm.dev / admin123

## Features

- **Dashboard** — stat cards, Chart.js bar/doughnut charts
- **Customers** — CRUD, search, filter by status (lead/active/churned)
- **Deals** — CRUD, stages (new/qualified/proposal/won/lost)
- **Infrastructure** — network topology, live instances, scaling controls, autoscaler, load testing

## Production Deployment

1. Set GitHub Secrets:
   - `SERVER_HOST` — 16.171.253.74
   - `SERVER_USER` — ubuntu
   - `SSH_PRIVATE_KEY` — SSH private key
   - `SECRET_KEY` — JWT secret
   - `DB_PASSWORD` — PostgreSQL password

2. Push to `main` branch — CI/CD auto-deploys

## Infrastructure Controls

- Scale up/down (1-6 instances)
- Autoscaler (RPS-based, cooldown 15s)
- Load test (50 burst requests)
- Drain/deregister instances
- Real-time network topology visualization

## License

MIT
