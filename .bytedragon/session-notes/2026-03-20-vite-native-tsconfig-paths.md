---
created: 2026-03-20
expires: 2027-03-20
confidence: high
category: GOTCHA
---

# vite-tsconfig-paths Plugin Deprecated — Use Native resolve.tsconfigPaths

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

The implementation-specialist included `vite-tsconfig-paths` as a
Vitest plugin for resolving TypeScript path aliases (like `@/` for
`src/`). Vite now supports this natively.

### Discovery

Vite emits a warning: "The plugin vite-tsconfig-paths is detected.
Vite now supports tsconfig paths resolution natively via the
resolve.tsconfigPaths option."

The native option is a simple boolean flag in the Vite config:
```typescript
resolve: {
  tsconfigPaths: true,
}
```

### Solution/Decision

GOTCHA: Do not install `vite-tsconfig-paths`. Use the native Vite
option instead. The plugin was removed from `apps/web/package.json`
and the vitest config updated.

### References

- `apps/web/vitest.config.mts` — uses `resolve: { tsconfigPaths: true }`

### Impact

One fewer dependency. Implementation agents should not add
`vite-tsconfig-paths` to any package.
