# Uptime Monitoring Service — MVP & Development Roadmap

This roadmap is **planning only**.

It defines progressive application milestones while keeping infrastructure and operations human-owned, per `AGENTS.md` and `AI_POLICY.md`.

## Scope Principles

- Start with a single deployable application (modular monolith).
- Prioritize smallest useful functionality first.
- Avoid premature microservices, Kubernetes, and enterprise-scale complexity.
- Separate **application implementation** from **DevOps runtime ownership**.

---

## Milestone 1 — Smallest Useful MVP (Single-project uptime checks)

### Goal
Provide a usable baseline service that monitors URLs and shows current/recent uptime status.

### User-facing functionality
- Create, edit, pause, and delete uptime checks.
- View current status (up/down) and last check time.
- View simple recent history (for example, last 24 hours per check).

### Backend requirements
- Core scheduler/executor for HTTP/HTTPS checks.
- Status evaluation rules (success/failure/timeout).
- CRUD API for checks and status/history retrieval.
- Basic structured error handling and application logs.

### Frontend requirements
- Minimal dashboard to list checks and current state.
- Basic forms to create and update checks.
- Simple per-check history view.

### Database/application data requirements
- Check definition entity (name, URL, interval, timeout, active flag).
- Check result entity (timestamp, response time, status, error reason).
- Basic retention rule for historical check results.

### Application testing requirements
- Unit tests for status evaluation and validation rules.
- Integration tests for check CRUD and result recording.
- End-to-end test for create check → run check → status visible in UI/API.

## DevOps Requirements
Describe runtime needs only (not implementation details):
- Persistent runtime for the application process.
- Persistent data storage for application records.
- Outbound network access to monitored targets.
- Stable and synchronized system time.
- Accessible runtime logs for troubleshooting.

### Acceptance criteria
- Users can manage checks and view current state/history in one UI.
- Scheduled checks run at configured intervals.
- Check outcomes persist across restarts.
- Supports a small set of concurrent checks for one project/team.

### Dependencies on previous milestones
- None.

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

1. Define MVP domain model for checks and check results.
2. Document MVP API surface for check management and status retrieval.
3. Define scheduler/check execution behavior and status rules (product spec).
4. Design minimal dashboard UX for check list and per-check history.
5. Define Milestone 1 acceptance test matrix (unit/integration/end-to-end).
6. Document Milestone 1 runtime requirements handoff to DevOps owner.
