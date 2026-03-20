---
created: 2026-03-20
expires: 2027-03-20
confidence: high
category: GOTCHA
---

# Turborepo v2 Requires packageManager Field in Root package.json

## Sanitization Checklist (MANDATORY)

**Complete before saving**:
- [x] No API keys, tokens, or credentials
- [x] No customer data or personally identifiable information (PII)
- [x] No internal URLs or infrastructure details
- [x] No proprietary business logic or trade secrets
- [x] Only public or project-local information included

---

## Category: GOTCHA

### Context

After creating the monorepo skeleton (Phase 1+2), the first
`npx turbo build` failed with: "Could not resolve workspaces.
Missing packageManager field in package.json"

### Discovery

Turborepo v2 requires the `packageManager` field in the root
`package.json` to resolve workspaces. Without it, Turborepo
cannot determine which package manager to use and fails
immediately.

The field format is: `"packageManager": "npm@<version>"`
(use `npm --version` to get the exact version).

### Solution/Decision

GOTCHA: Always include `packageManager` in root `package.json`
when scaffolding a Turborepo monorepo. This should be part of
the Phase 1 setup tasks. The error message is somewhat unclear —
it says "Could not resolve workspaces" which suggests a workspace
config issue, not a missing field.

### References

- `package.json` — root package.json has `packageManager` field
- `turbo.json` — Turborepo config (tasks definition)

### Impact

Added the field and Turborepo worked immediately. Future scaffold
specs should include this as an explicit requirement.
