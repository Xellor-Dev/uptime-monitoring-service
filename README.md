# uptime-monitoring-service
A self-hosted uptime monitoring service and DevOps learning project built with an AI-assisted development workflow.


## Planning

- [MVP & Development Roadmap](./PROJECT_ROADMAP.md)

## Backend (M1.1 skeleton)

Minimal backend service is available at:
- `/home/runner/work/uptime-monitoring-service/uptime-monitoring-service/app/backend`

Run locally:

```bash
cd /home/runner/work/uptime-monitoring-service/uptime-monitoring-service/app/backend
npm start
```

Health endpoint:

```bash
curl http://127.0.0.1:3000/health
```


## Frontend (M1.1 skeleton)

Minimal frontend service is available at:
- `/home/runner/work/uptime-monitoring-service/uptime-monitoring-service/app/frontend`

Run locally:

```bash
cd /home/runner/work/uptime-monitoring-service/uptime-monitoring-service/app/frontend
npm start
```

Frontend page:

```bash
curl http://127.0.0.1:4173/
```

The page fetches backend health from `http://127.0.0.1:3000/health` and displays the current state.

