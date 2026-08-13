# uptime-monitoring-service
A self-hosted uptime monitoring service and DevOps learning project built with an AI-assisted development workflow.


## Planning

- [MVP & Development Roadmap](./PROJECT_ROADMAP.md)

## Backend (M1.1 skeleton)

Minimal backend service is available at `app/backend`.

Run locally:

```bash
cd app/backend
npm start
```

Health endpoint:

```bash
curl http://127.0.0.1:3000/health
```

For durable check definitions and latest results, set `DATABASE_URL` to a
PostgreSQL connection string before starting the backend. The application
applies the numbered SQL migrations in `app/backend/migrations` on startup.
Without `DATABASE_URL`, the backend uses an in-memory store for development and
tests.

## Local PostgreSQL runtime

The local development runtime uses PostgreSQL 17 through Docker Compose. Check
definitions and their latest results are stored in the `postgres_data` named
volume, so they survive backend restarts, PostgreSQL restarts, and PostgreSQL
container replacement.

Prerequisites:

- Docker Engine with Docker Compose v2
- Node.js 18 or newer

Create the local environment file from the committed template:

```bash
cp .env.example .env
```

Replace the example password in `.env` with a local value. The `.env` file is
ignored by Git and must not be committed.

Start PostgreSQL and wait until its healthcheck succeeds:

```bash
docker compose up -d --wait postgres
docker compose ps
```

The service is published only on `127.0.0.1:5432`. Load the trusted local
environment file and construct a correctly encoded connection URL without
printing the password:

```bash
cd app/backend
set -a
source ../../.env
set +a

export DATABASE_URL="$(
  node -e '
    const url = new URL("postgresql://127.0.0.1:5432");
    url.username = process.env.POSTGRES_USER;
    url.password = process.env.POSTGRES_PASSWORD;
    url.pathname = "/" + process.env.POSTGRES_DB;
    process.stdout.write(url.href);
  '
)"
```

Install dependencies and start the backend from the same terminal:

```bash
npm ci
npm start
```

In another terminal, verify the application:

```bash
curl --fail http://127.0.0.1:3000/health
curl --fail http://127.0.0.1:3000/checks
```

The expected health response is `{"status":"ok"}`. When `DATABASE_URL` is
present, this response also confirms that the backend connected to PostgreSQL
and applied its application migrations. If the database is unavailable, health
returns HTTP `503` with a `degraded` status and a database dependency status.

To run the PostgreSQL integration tests, load the environment and construct
`DATABASE_URL` as shown above, then run:

```bash
node --test test/postgres-store.integration.test.js
```

Both tests must pass with zero skipped tests. When finished, remove credentials
from the current shell session:

```bash
unset DATABASE_URL POSTGRES_PASSWORD POSTGRES_USER POSTGRES_DB
```

Stop the local runtime while preserving its data:

```bash
docker compose down
```

Do not add `--volumes` unless deleting the local database is intentional.
`docker compose down --volumes` removes the `postgres_data` volume and all data
stored in it.


## Frontend (M1.1 skeleton)

Minimal frontend service is available at `app/frontend`.

Run locally:

```bash
cd app/frontend
npm start
```

Frontend page:

```bash
curl http://127.0.0.1:4173/
```

The page fetches backend health from `http://127.0.0.1:3000/health` and displays the current state.

## Local run checklist

1. Start the backend:

```bash
cd app/backend
npm start
```

2. In a second terminal, start the frontend:

```bash
cd app/frontend
npm start
```

3. Check backend health with `curl`:

```bash
curl http://127.0.0.1:3000/health
```

4. Open the frontend in a browser:

```text
http://127.0.0.1:4173/
```

Expected result:
- backend responds with `{"status":"ok"}`
- frontend shows `Backend health: ok`
