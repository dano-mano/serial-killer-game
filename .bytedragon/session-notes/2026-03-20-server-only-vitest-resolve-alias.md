---
created: 2026-03-20
expires: 2027-03-20
confidence: high
category: GOTCHA
---

# server-only Import Breaks Vitest — Use resolve.alias Stub

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

Adding `import 'server-only'` to `env.ts` (for Constitution VII
compliance — server-only guard on module containing
SUPABASE_SERVICE_ROLE_KEY) broke the env validation tests.

### Discovery

The `server-only` package is a Next.js convention that throws at
import time in client bundles. In Vitest, the package can't be
resolved at all — Vite's import analysis plugin fails before the
test even runs.

`vi.mock('server-only', () => ({}))` does NOT work when the test
uses `vi.resetModules()` + dynamic import pattern (which env tests
require to re-validate config on each test). The mock is cleared
by `resetModules()`.

Mocking in `vitest.setup.ts` has the same problem — it doesn't
survive module resets.

### Solution/Decision

GOTCHA: Use a Vite `resolve.alias` in the vitest config to point
`server-only` to a stub file. This handles resolution at the Vite
transform level, not the mock level, so it survives module resets.

```typescript
// apps/web/vitest.config.mts
resolve: {
  alias: {
    'server-only': new URL('./vitest.server-only-stub.ts', import.meta.url).pathname,
  },
},
```

The stub file (`apps/web/vitest.server-only-stub.ts`) is a no-op:
```typescript
export {}
```

This pattern will be needed every time a new `import 'server-only'`
is added to a module that has tests.

### References

- `apps/web/vitest.config.mts` — resolve.alias configuration
- `apps/web/vitest.server-only-stub.ts` — the stub file
- `apps/web/tests/config/env.test.ts` — test that requires this pattern
- `apps/web/src/config/env.ts` — server-only guard
- `apps/web/src/lib/logger/pino.ts` — also has server-only (untested currently)
- `apps/web/src/sentry.server.config.ts` — also has server-only

### Impact

Unblocked adding server-only guards to server modules while
maintaining test functionality. Any future server-only module
that gets tested will automatically benefit from the alias.
