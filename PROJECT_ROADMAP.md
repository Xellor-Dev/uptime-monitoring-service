# Uptime Monitoring Service — MVP & Development Roadmap

This roadmap is **planning only**.

It defines progressive application milestones while keeping infrastructure and operations human-owned, per `AGENTS.md` and `AI_POLICY.md`.

## Scope Principles

- Start with a single deployable application (modular monolith).
- Prioritize smallest useful functionality first.
- Avoid premature microservices, Kubernetes, and enterprise-scale complexity.
- Separate **application implementation** from **DevOps runtime ownership**.

---

## Milestone 1 — Smallest Useful MVP (progressive sub-milestones)

Milestone 1 is intentionally split into small, independently reviewable phases so the human DevOps owner can run, inspect, troubleshoot, and understand each version before additional application complexity is introduced.

### M1.1 — Minimal application skeleton

#### Goal
Establish the smallest end-to-end application baseline.

#### User-facing functionality
- Render a minimal frontend page that confirms the app is running.
- Expose basic service health status.

#### Backend requirements
- Minimal backend service bootstrapped with one health endpoint.
- Basic request/response plumbing and error handling baseline.

#### Frontend requirements
- Minimal frontend shell/page connected to backend health state display.

#### Database/application data requirements
- No persistent database in this phase.
- No PostgreSQL, Redis, queues, or background workers.

#### Application testing requirements
- Application-level tests for backend health endpoint behavior.
- Application-level tests that verify the frontend renders and can show health state.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Runtime capable of executing one backend process and one frontend process/build output.
- Network access between frontend and backend within runtime environment.
- Ability to observe application startup output and health response.

#### Acceptance criteria
- Backend health endpoint responds successfully.
- Frontend minimal page is reachable and shows expected basic state.
- Tests for health path and minimal UI pass.

#### Dependencies on previous milestones
- None.

#### Human DevOps pause gate before M1.2
After M1.1 application implementation, development pauses for human-owned runtime validation and inspection before any M1.2 work begins.

### M1.2 — Basic uptime checks without persistent storage

#### Goal
Introduce first useful monitoring behavior without adding persistence.

#### User-facing functionality
- Create, list, update, pause, and delete uptime checks in-memory.
- Run manual checks and view immediate result state.

#### Backend requirements
- In-memory check model and validation.
- HTTP/HTTPS check execution on demand (manual trigger).
- API endpoints for in-memory check CRUD and latest result.

#### Frontend requirements
- UI for in-memory check management.
- UI control to run a check manually and view latest result.

#### Database/application data requirements
- In-memory storage only; data resets on restart.

#### Application testing requirements
- Unit tests for URL/interval validation and check result mapping.
- Integration tests for in-memory CRUD and manual check execution.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Outbound network access from runtime to monitored endpoints.
- Runtime visibility to inspect transient behavior across restarts.

#### Acceptance criteria
- Users can manage checks and run checks manually.
- Results are visible immediately and clearly marked non-persistent.

#### Dependencies on previous milestones
- Depends on M1.1 baseline application skeleton.

### M1.3 — PostgreSQL persistence

#### Goal
Add durable storage for checks and latest results.

#### User-facing functionality
- Previously created checks remain available after restart.
- Latest check result persists and is visible after restart.

#### Backend requirements
- Persistent repository layer backed by PostgreSQL.
- Data mapping/migration support for checks and latest results.
- API behavior unchanged from M1.2 from user perspective.

#### Frontend requirements
- Existing M1.2 UI retained; behavior reflects persisted data.

#### Database/application data requirements
- PostgreSQL schema for check definitions and latest check result state.
- Basic migration/versioning strategy for schema evolution.

#### Application testing requirements
- Integration tests validating persistence behavior across restarts (or equivalent lifecycle tests).
- Tests for repository error handling and validation constraints.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Application runtime access to persistent PostgreSQL storage.
- Runtime configuration for database connection settings and secrets.
- Data durability appropriate for retaining check configuration and latest state.

#### Acceptance criteria
- Check definitions and latest results persist across restarts.
- App handles unavailable database dependency with clear error signaling.

#### Dependencies on previous milestones
- Depends on M1.2 in-memory check lifecycle/API contract.

### M1.4 — Scheduled checks and history

#### Goal
Automate checks and store time-series result history.

#### User-facing functionality
- Checks run automatically by configured interval.
- Users can view recent check history and status trend.

#### Backend requirements
- Internal scheduler for interval-based check execution.
- History recording for each execution result.
- Failure/timeout classification and response-time capture.

#### Frontend requirements
- Current status plus recent history display per check.
- Interval configuration controls.

#### Database/application data requirements
- Persistent history records linked to checks.
- Retention policy definition for historical results.

#### Application testing requirements
- Tests for scheduler timing behavior and missed-run handling.
- Integration tests for history persistence and retrieval.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Stable runtime clock/time synchronization for reliable scheduling.
- Persistent storage capacity for historical result growth.
- Runtime observability for scheduler execution health.

#### Acceptance criteria
- Scheduled checks execute reliably at configured intervals.
- Recent history is queryable and visible in UI.

#### Dependencies on previous milestones
- Depends on M1.3 persistent data layer.

### M1.5 — MVP stabilization

#### Goal
Harden MVP quality before moving to Milestone 2 features.

#### User-facing functionality
- More predictable error states and clearer degraded/unavailable messaging.
- Stable baseline UX for check management and history viewing.

#### Backend requirements
- Input validation hardening and consistent error contracts.
- Reliability pass for scheduler/check execution edge cases.
- Basic health/readiness behavior aligned with runtime troubleshooting needs.

#### Frontend requirements
- Error-state UX improvements and form validation feedback.
- Minor usability improvements without adding new major features.

#### Database/application data requirements
- Index/constraint review for current MVP queries and writes.
- Retention/cleanup behavior validated for history data.

#### Application testing requirements
- Targeted regression suite for M1.1–M1.4 flows.
- Expanded integration tests for restart and failure scenarios.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Runtime logging/visibility sufficient to diagnose failed checks and scheduler errors.
- Repeatable runtime startup behavior that can be validated by human owner.
- Clear health endpoints/signals for service status inspection.

#### Acceptance criteria
- Core MVP flows pass regression tests reliably.
- Known high-risk failure paths produce expected, diagnosable behavior.
- MVP is ready for alerting/incident work in Milestone 2.

#### Dependencies on previous milestones
- Depends on M1.1 through M1.4.

---

## Milestone 2 — Actionable Monitoring (Alerting and incident visibility)

### Goal
Make the MVP operationally useful with alerts and incident tracking.

### User-facing functionality
- Configure alert destinations per check (for example, email/webhook definitions).
- Receive alerts on failure and recovery.
- View incident timeline for each check (open/closed incidents).

### Backend requirements
- Alert transition rules for failure/recovery.
- Notification dispatch abstraction with retry-aware tracking.
- Incident lifecycle model (open, updated, resolved).
- Deduplication/suppression to avoid noisy repeated alerts.

### Frontend requirements
- Alert configuration screens.
- Incident list and incident detail timeline.
- Clear indicators for active incidents vs healthy checks.

### Database/application data requirements
- Alert destination/config entities.
- Notification event log (attempted/sent/failed).
- Incident entities linked to checks and result events.

### Application testing requirements
- Transition tests: up→down triggers alert, down→up triggers recovery.
- Tests for duplicate alert suppression behavior.
- End-to-end test for incident creation and closure visibility.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Runtime support for outbound channels required by configured alert destinations.
- Secure storage for notification-related secrets.
- Runtime health visibility for app and notification failures.

### Acceptance criteria
- Failure and recovery alerting works without alert storms.
- Incident timelines accurately represent downtime windows.
- Active incidents are quickly identifiable in the UI.

### Dependencies on previous milestones
- Depends on Milestone 1 check execution and stored results.

---

## Milestone 3 — Team Usability (Auth, organization, quality-of-life)

### Goal
Support real team usage with access control and better organization.

### User-facing functionality
- User authentication and role-based access (owner/member/viewer).
- Organize checks by project/group/tags.
- Maintenance windows to suppress alerts during planned work.

### Backend requirements
- Authentication/session/token flow and authorization rules.
- Team-aware access boundaries.
- Maintenance-window-aware check and alert behavior.
- Audit trail for critical user actions.

### Frontend requirements
- Login/logout and role-aware navigation.
- Project/group/tag filtering in dashboard.
- Maintenance window management UI.

### Database/application data requirements
- User, project/team, and role mapping entities.
- Group/tag metadata for checks.
- Maintenance window definitions and audit records.

### Application testing requirements
- Authorization tests for role and tenant boundaries.
- Maintenance window tests for expected alert suppression.
- End-to-end tests for team-scoped workflows.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Secure runtime configuration for identity/auth secrets.
- Backup/restore capability for user/team/application data.
- Access-log retention aligned with audit expectations.

### Acceptance criteria
- Multiple users can collaborate with correct access boundaries.
- Teams can filter and manage larger check sets effectively.
- Planned maintenance does not generate false operational noise.

### Dependencies on previous milestones
- Depends on Milestones 1 and 2.

---

## Milestone 4 — Fuller Application (Reporting, status pages, integrations)

### Goal
Round out the product for regular operational usage with reporting and integrations.

### User-facing functionality
- Uptime/SLA summary reporting by period.
- Public/private status page views.
- Integration hooks for external workflows (generic outbound events).

### Backend requirements
- Reporting aggregation from historical check/incident data.
- Status-page projection layer.
- Integration event publishing with delivery observability.
- Reliability/performance hardening for sustained daily usage.

### Frontend requirements
- Reporting dashboards (trends, uptime %, incident counts).
- Status-page configuration and preview.
- Integration settings visibility and event history.

### Database/application data requirements
- Aggregated reporting tables/views.
- Status page configuration entities.
- Integration event history and delivery outcomes.

### Application testing requirements
- Accuracy tests for uptime/SLA calculations.
- End-to-end tests for status page updates from live check state.
- Regression tests for core monitoring and alerting flows.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Scheduled execution capacity for reporting/aggregation workloads.
- Data retention support for raw and aggregated records.
- Runtime observability for latency/error trends.

### Acceptance criteria
- Users can generate trustworthy uptime reports.
- Status pages reflect near-real-time monitoring state.
- External integrations are reliable and auditable.

### Dependencies on previous milestones
- Depends on Milestones 1, 2, and 3.

---

## Proposed GitHub Issues for Milestone 1 (for human review; do not create yet)

### M1.1 — Minimal application skeleton

1. **[AI application work] Create minimal backend skeleton with health endpoint**
   - Required outcome: running backend with a health endpoint suitable for runtime inspection.
2. **[AI application work] Create minimal frontend skeleton and health display**
   - Required outcome: minimal UI page that confirms service availability and health status.
3. **[AI review/testing] Add application-level tests for M1.1 backend/frontend baseline**
   - Required outcome: tests validating backend health behavior and minimal frontend render path.
4. **[Human DevOps work] Run and inspect M1.1 runtime behavior (learning checkpoint)**
   - Learning objective: understand baseline app runtime lifecycle, logs, endpoint reachability, and failure signals.
   - Required outcome: documented confirmation that M1.1 can be run/inspected and is ready for M1.2.

### M1.2 — Basic uptime checks without persistence

5. **[AI application work] Implement in-memory check CRUD and manual execution API**
   - Required outcome: users can manage checks and trigger manual check runs without persistence.
6. **[AI application work] Implement minimal UI for in-memory checks and latest result**
   - Required outcome: UI can create/manage checks and display manual run outcomes.
7. **[AI review/testing] Add tests for in-memory check flow and validation**
   - Required outcome: tests cover in-memory CRUD, validation, and manual check execution paths.
8. **[Human DevOps work] Validate restart behavior and outbound reachability for M1.2**
   - Learning objective: observe ephemeral data behavior and runtime networking constraints.
   - Required outcome: documented verification of expected data reset-on-restart and endpoint reachability characteristics.

### M1.3 — PostgreSQL persistence

9. **[AI application work] Add PostgreSQL-backed persistence for checks and latest result**
   - Required outcome: check definitions/latest status survive restarts using PostgreSQL.
10. **[AI review/testing] Add persistence integration tests for M1.3**
    - Required outcome: tests validate durable behavior and repository error handling.
11. **[Human DevOps work] Provide runtime PostgreSQL capability for app consumption**
    - Learning objective: understand application database dependency boundaries, configuration, and durability expectations.
    - Required outcome: runtime environment can supply persistent PostgreSQL connectivity required by the app.

### M1.4 — Scheduled checks and history

12. **[AI application work] Implement interval scheduler and persistent check history**
    - Required outcome: checks execute on schedule and history is stored/retrieved.
13. **[AI application work] Extend UI for interval configuration and history visibility**
    - Required outcome: UI supports interval setup and recent history viewing.
14. **[AI review/testing] Add scheduler/history test coverage**
    - Required outcome: tests cover scheduling behavior, timeout/failure mapping, and history retrieval.
15. **[Human DevOps work] Validate runtime clock stability and history growth characteristics**
    - Learning objective: understand timing sensitivity and storage growth implications of scheduled workloads.
    - Required outcome: documented validation that runtime supports stable scheduling behavior and expected history data growth.

### M1.5 — MVP stabilization

16. **[AI application work] Stabilize error contracts and core UX for MVP readiness**
    - Required outcome: predictable API/UI behavior under common failure and validation scenarios.
17. **[AI review/testing] Build targeted regression suite for M1.1–M1.4**
    - Required outcome: reliable regression coverage for core MVP flows.
18. **[Human DevOps work] Final Milestone 1 runtime readiness review**
    - Learning objective: evaluate operational readiness of the MVP baseline before alerting features.
    - Required outcome: explicit go/no-go decision for entering Milestone 2.
