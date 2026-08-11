# URL Shortener

A Bitly-style URL shortener built with the **PERN stack** (PostgreSQL, Express, React, Node.js) and Redis.

## Quick Start

```bash
npm run install:all
npm run docker:up          # Start PostgreSQL + Redis (requires Docker Desktop)
npm run db:migrate
npm run dev:backend        # http://localhost:5001
npm run dev:frontend       # http://localhost:3000
```

## Documentation

See **[docs/GUIDE.md](docs/GUIDE.md)** for the full setup guide, including:

- Docker, PostgreSQL, and Redis setup
- API reference
- Project architecture
- Troubleshooting

PDF version: **[docs/GUIDE.pdf](docs/GUIDE.pdf)**

## Features

- Shorten long URLs with auto-generated or custom aliases
- HTTP redirect on visit (301/302)
- Optional per-link expiry
- Redis caching for fast redirects

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite |
| Backend | Express |
| Database | PostgreSQL |
| Cache | Redis |
| Infra | Docker Compose |
