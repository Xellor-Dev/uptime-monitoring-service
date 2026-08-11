# 2026-08-11

## What I Learned Today

- How to run a Node.js application locally from the project root.
- How to start the backend and frontend as separate processes.
- How to check backend health with `curl`.
- How to open the frontend in the browser and verify that it can reach the backend.

## What I Did Manually

- Changed into `app/backend`.
- Started the backend with `npm start`.
- Changed into `app/frontend`.
- Started the frontend with `npm start`.
- Checked the backend with:
  - `curl http://127.0.0.1:3000/health`
- Opened the frontend at:
  - `http://127.0.0.1:4173/`

## What I Understood

- The `/home/runner/work/...` path in `README.md` belongs to the CI environment, not my local Mac.
-