# Fotih CRM — Sales Intelligence Platform

Full-stack CRM with cloud architecture dashboard built for BTEC Unit 6 "Networking in the Cloud".

## Architecture

```
Internet :80
    │
┌───▼────┐  public subnet
│  nginx  │  React SPA + /api load balance
└───┬────┘
    │ private subnet
┌───┼─────────────┐
│ ┌─▼──┐          │  ┌────────────┐
│ │api×N│          │  │ PostgreSQL │
│ └──┬──┘          │  └────────────┘
│    └─────────────┘│
└───────────────────┘
```

## Tech Stack

| Layer      | Technology |
|-----------|-----------|
| Backend   | FastAPI, SQLAlchemy, PostgreSQL, JWT |
| Frontend  | React 18, Ant Design 5, ReactFlow, Chart.js, Framer Motion |
| Infra     | Docker, Docker Compose, Nginx 1.27 |
| CI/CD     | GitHub Actions → GHCR → SSH deploy |

## Quick Start (Local)

```bash
docker compose up -d --build --scale api=3
```

Open http://localhost:8080

**Login:** admin@fotihcrm.uz / admin123

## Features

- **Dashboard** — stat cards with period filters (daily/weekly/monthly/yearly), animated charts, revenue trends
- **Customers** — CRUD, search, filter by status (20+ demo records)
- **Deals** — CRUD, stages pipeline (15 demo deals)
- **Cloud Architecture** — AWS VPC diagrams, CI/CD pipeline flow, Docker architecture, security overview
- **Dark Mode** — full dark/light theme toggle
- **Animations** — page transitions, chart animations (Framer Motion)

## Production Deployment

1. Set GitHub Secrets:
   - `SERVER_HOST` — server IP
   - `SERVER_USER` — ubuntu
   - `SSH_PRIVATE_KEY` — SSH private key
   - `SECRET_KEY` — JWT secret
   - `DB_PASSWORD` — PostgreSQL password

2. Push to `main` branch — CI/CD auto-deploys

## Author

Abduqodir Fotih

## License

MIT
