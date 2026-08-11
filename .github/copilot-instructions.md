# GitHub Copilot Repository Instructions

This repository is a DevOps learning project.

Read and follow `/AGENTS.md` and `/AI_POLICY.md` before making changes.

## Copilot scope

GitHub Copilot agents are application-development contributors.

They MAY modify:
- `app/frontend/**`
- `app/backend/**`
- application-level tests
- application schemas/migrations
- application documentation

They MUST NOT modify or create:
- `infra/**`
- `Dockerfile*`
- `compose*.yml`
- `compose*.yaml`
- `.github/workflows/**`
- Terraform
- Ansible
- Kubernetes manifests
- reverse-proxy configuration
- DNS/TLS configuration
- monitoring or logging infrastructure
- cloud infrastructure
- `LEARNING.md`

If an application feature requires infrastructure work, STOP at the application boundary.

Instead, include a section in the pull request:

## DevOps Requirements
- required ports
- required environment variables
- persistent storage requirements
- external services
- database requirements
- health endpoints
- expected runtime behavior

Do not implement those requirements.

## Authorship

When work is performed by the GitHub Copilot coding agent, preserve GitHub's native agent attribution.

Do not rewrite commits in a way that makes AI-generated application work appear to have been authored solely by the human repository owner.