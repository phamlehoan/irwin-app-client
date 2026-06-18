# Áng Dương Platform (warehouse-app-client)

Vue 3 + Quasar frontend for the Áng Dương production & warehouse management system.

## Setup

```bash
pnpm install
cp .env.example .env
```

Set `VITE_CLOUD_API_URL` to the warehouse-server base URL (default `http://localhost:8000`).

**Admin login (dev):** `admin@example.com` / `password123` — requires RBAC seed on the server (`pnpm db:seed` now includes it; or run `pnpm db:seed:rbac` if the user already exists).

## Development

```bash
pnpm dev
```

## Production build

```bash
pnpm build
```

## Features (shell)

- Authentication (login, activate account, reset password, profile)
- Admin RBAC (users, roles & permissions) — `/api/v1/admin/*`
- **Notifications** — in-app inbox + topic settings — `/api/v1/notifications/*`
- AI assistant — `POST /api/v1/ai/chat`

Business modules (purchasing, inventory, production, sales) will be added per rollout plan in `documents/`.
