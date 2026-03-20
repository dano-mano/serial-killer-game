---
created: 2026-03-20
expires: 2027-03-20
confidence: high
category: GOTCHA
---

# Zod v4 Deprecated String Validators — Use Top-Level API

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

During the scaffold implementation, Zod schemas were written using the
chained string validator pattern (e.g., `z.string().url()`). These work
at runtime but emit deprecation warnings in Zod v4.

### Discovery

Zod v4 moved format validators from `z.string()` methods to top-level
`z` namespace functions. The old forms still work but are deprecated
and may be removed in future versions.

Deprecated → Replacement:
- `z.string().url()` → `z.url()`
- `z.string().uuid()` → `z.uuid()`
- `z.string().email()` → `z.email()`
- `z.string().datetime()` → `z.iso.datetime()`
- `z.string().date()` → `z.iso.date()`

Still valid (NOT deprecated):
- `z.string().min()`, `.max()`, `.length()`, `.regex()`
- `z.string().optional()`
- `z.enum()`, `z.object()`, `z.number()` chains

The top-level validators accept the same options:
`z.url({ message: 'Must be a valid URL' })`

### Solution/Decision

GOTCHA: When writing Zod schemas in this project (Zod v4), always use
top-level format validators. The implementation-specialist and any
future code that adds Zod schemas should use `z.url()` not
`z.string().url()`.

### References

- `apps/web/src/config/env.ts` — env schema uses `z.url()` (corrected)
- `packages/shared/src/schemas/common.ts` — uses `z.uuid()`, `z.iso.datetime()` (corrected)
- Zod v4 changelog: format validators moved to top-level

### Impact

All existing Zod schemas in the codebase have been migrated. Future
schemas must follow the top-level pattern from the start.
