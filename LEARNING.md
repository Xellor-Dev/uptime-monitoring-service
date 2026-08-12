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

- Use tests from AI Test Enginieer.

xellor@Daniels-MacBook-Pro frontend % npm test

> frontend@1.0.0 test
> node --test

✔ index page includes minimal health display skeleton (2.75175ms)
✔ fetchHealthState returns ok state for healthy backend payload (0.450625ms)
✔ initHealthDisplay updates health status text (0.134708ms)
✔ frontend server serves minimal page (21.51175ms)
✔ renderHealthState marks error state (0.107667ms)
ℹ tests 5
ℹ suites 0
ℹ pass 5
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 76.531958
xellor@Daniels-MacBook-Pro frontend % 

xellor@Daniels-MacBook-Pro backend % npm test

> backend@1.0.0 test
> node --test

✔ GET /health returns 200 and service status (25.376042ms)
✔ unknown path returns 404 error payload (4.294791ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 117.5545
xellor@Daniels-MacBook-Pro backend % 

## What I Understood

- The `/home/runner/work/...` path in `README.md` belongs to the CI environment, not my local Mac.
