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
