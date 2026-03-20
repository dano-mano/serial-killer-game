---
created: 2026-03-20
expires: 2027-03-20
confidence: high
category: PATTERN
---

# Sentry @sentry/nextjs API Drifts Rapidly — Type-Check Config Immediately

## Sanitization Checklist (MANDATORY)

**Complete before saving**:
- [x] No API keys, tokens, or credentials
- [x] No customer data or personally identifiable information (PII)
- [x] No internal URLs or infrastructure details
- [x] No proprietary business logic or trade secrets
- [x] Only public or project-local information included

---

## Category: PATTERN

### Context

During scaffold implementation, the quality-auditor caught a HIGH
issue: `hideSourceMaps` in `next.config.ts` does not exist on the
current `SentryBuildOptions` type. The `automaticVercelMonitors`
and `disableLogger` options also emitted deprecation warnings at
runtime.

### Discovery

The @sentry/nextjs SDK evolves rapidly. Options that appear in
docs, blog posts, and even official examples may be deprecated or
removed in the installed version. Three options were affected in
this scaffold:

- `hideSourceMaps` → replaced by `sourcemaps: { deleteSourcemapsAfterUpload: boolean }`
- `disableLogger` → removed (use webpack config, not supported with Turbopack)
- `automaticVercelMonitors` → Vercel-specific, not applicable to Azure hosting

### Solution/Decision

PATTERN: When implementing Sentry configuration:

1. Use the ACTUAL TypeScript types from the installed SDK, not docs
2. Run `npx turbo type-check` immediately after writing Sentry config
3. Check for deprecation warnings by running `npm run dev` and reading
   the startup output
4. Do not include Vercel-specific options when not deploying to Vercel

The quality-auditor should specifically check Sentry config files
for type errors and deprecation warnings.

### References

- `apps/web/next.config.ts` — withSentryConfig options (corrected)
- `apps/web/src/sentry.server.config.ts` — Sentry.init with pinoIntegration
- `apps/web/src/instrumentation-client.ts` — client-side Sentry init

### Impact

Prevented a CI type-check failure (`hideSourceMaps`) and eliminated
two runtime deprecation warnings. Established the pattern of
type-checking Sentry config immediately rather than relying on
documentation accuracy.
