Repository ownership model

Human-owned:
- infrastructure/**
- Dockerfile*
- compose*.yml / compose*.yaml
- reverse proxy configuration
- .github/workflows/**
- cloud configuration
- Terraform / Ansible / Kubernetes
- DNS / TLS / networking
- monitoring / logging / alerting
- secrets management
- deployment and rollback configuration
- LEARNING.md

AI-owned / AI-assisted:
- app/frontend/**
- app/backend/**
- application-level tests
- UI/UX
- application database schemas and migrations
- product documentation

Rules:
1. AI agents MUST NOT implement human-owned areas.
2. If application work requires infrastructure changes, describe the runtime requirement instead of implementing it.
3. Do not create Dockerfiles, CI workflows, Terraform, Kubernetes manifests, deployment scripts, reverse-proxy configs, or cloud resources.
4. Do not modify LEARNING.md.
5. Do not claim human authorship for AI-generated application code.
6. Application agents should work through branches and pull requests whenever possible.
7. DevOps mentor/reviewer agents may inspect human-owned code but must not modify it unless the human explicitly exits learning mode.
