---
created: 2026-03-20
expires: 2027-03-20
confidence: high
category: GOTCHA
---

# .env.local Must Live at apps/web/ Not Repo Root

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

After implementing the 001-project-scaffold, the developer copied
`.env.example` to `.env.local` at the repo root and ran `npm run dev`.
The app failed with env validation errors despite all values being
correctly set.

### Discovery

In a Turborepo + Next.js monorepo, Next.js loads `.env*` files
relative to its own project directory (`apps/web/`), NOT the
monorepo root. Turborepo runs each task in the package's directory,
so `next dev` executes from `apps/web/` and only looks there for
`.env.local`.

A root-level `.env.local` is invisible to Next.js in this setup.

### Solution/Decision

GOTCHA: `.env.example` and `.env.local` must live at `apps/web/`:

```bash
cp apps/web/.env.example apps/web/.env.local
```

The `.env.example` was moved from repo root to `apps/web/` during
the scaffold implementation. README.md and quickstart.md were
updated to reflect the correct path.

The `.gitignore` pattern `.env*` at the repo root still covers
`apps/web/.env.local` because git applies patterns recursively.

### References

- `apps/web/.env.example` — The environment template (at app level)
- `specs/001-project-scaffold/quickstart.md` — Setup instructions
- `README.md` — Setup section
- `.specify/memory/constitution.md` — Principle II (centralized config)

### Impact

Without this knowledge, every new developer (or AI session) will
make the same mistake of placing `.env.local` at the repo root.
The error message from env.ts is clear about WHAT is wrong (missing
vars) but not WHERE the file should be.
