# AI Usage & Authorship Policy

This repository is both a software project and a personal DevOps learning environment.

AI-assisted development is intentionally used throughout the project. The goal is not to avoid AI, but to maintain a clear boundary between AI-generated application development and human-owned infrastructure engineering.

## Purpose

The application itself provides a realistic workload for learning and practicing DevOps.

AI agents may act as product managers, designers, application developers, testers, security reviewers, and technical mentors.

Infrastructure and operational engineering remain the responsibility of the human author.

## Ownership

### Human-owned

The following areas are designed, implemented, and operated by the human author:

- Linux administration
- Runtime environment
- Networking
- DNS and TLS configuration
- Containerization and Docker configuration
- Reverse proxy configuration
- CI/CD pipelines
- Infrastructure as Code
- Cloud infrastructure
- IAM and infrastructure security
- Secrets management
- Observability
- Monitoring and logging
- Backups and recovery
- Deployment strategies
- Incident investigation and troubleshooting
- Infrastructure architecture and technical decisions

AI may explain concepts, review work, identify problems, suggest documentation to read, and provide progressively stronger hints.

AI should not implement these areas on behalf of the human while the project is being used in learning mode.

### AI-owned / AI-assisted

AI agents may substantially or completely implement:

- Product requirements
- UI/UX design
- Frontend application code
- Backend application code
- Database application logic and schemas
- Application-level tests
- Mock data
- Application documentation
- Boilerplate and repetitive application code

The human author does not claim these areas as demonstrations of personal software-development ability unless explicitly stated otherwise.

## Learning Mode

For human-owned infrastructure work, AI agents should behave primarily as mentors and reviewers.

When the human encounters a problem, the preferred interaction is:

1. Ask the human to propose an approach.
2. Explain missing concepts when necessary.
3. Review the proposed solution.
4. Identify problems without immediately fixing them.
5. Provide hints progressively when the human is blocked.
6. Allow the human to implement the final infrastructure solution.
7. Review the completed implementation.

Complete infrastructure solutions should not be generated unless the human explicitly leaves learning mode and requests one.

## Infrastructure Review

AI may perform read-only reviews of human-written infrastructure.

Review agents are encouraged to challenge decisions involving:

- security
- reliability
- networking
- resource usage
- maintainability
- observability
- failure recovery
- cost
- operational complexity

Whenever possible, reviewers should ask why a decision was made before proposing a replacement.

## Incidents and Troubleshooting

AI agents may generate realistic incidents and failure scenarios for educational purposes.

When troubleshooting, AI should not reveal the root cause immediately.

It should allow the human to:

- inspect the system
- form hypotheses
- choose diagnostic tools
- interpret results
- attempt remediation

Hints may be provided progressively when requested.

## Authorship Transparency

The repository uses the following commit prefixes where practical:

- `human:` — primarily implemented by the human author
- `ai:` — primarily generated or implemented by AI
- `human+ai:` — substantial contribution from both

These labels describe the primary implementation process and are not intended as a line-by-line authorship guarantee.

Infrastructure commits should normally be marked `human:`.

AI-assisted research, explanations, autocomplete, documentation lookup, or review do not automatically make a human-written change `human+ai:`.

## Learning Log

`LEARNING.md` is human-owned.

It documents lessons learned during the project, including:

- problems encountered
- concepts learned
- infrastructure decisions
- mistakes and failed approaches
- troubleshooting experiences
- trade-offs
- decisions that would be made differently in the future

AI may help review grammar or clarity, but should not generate the experiences, conclusions, or technical reasoning recorded in the learning log.

## Security

AI agents must not be given unrestricted access to production credentials or infrastructure unnecessarily.

Sensitive information such as:

- API keys
- cloud credentials
- SSH private keys
- access tokens
- passwords
- production secrets

must not be committed to the repository or intentionally included in AI prompts.

Destructive infrastructure operations require explicit human approval.

Infrastructure changes should use previews, plans, dry-runs, or equivalent mechanisms whenever available.

## Principle

AI is a tool and a member of the application-development workflow.

It is not a substitute for understanding the infrastructure.

If an infrastructure decision appears in this repository, the goal is for the human author to be able to explain:

- what it does
- why it exists
- why this approach was chosen
- what alternatives exist
- how it can fail
- how it can be diagnosed
- how it can be improved
