---
created: 2026-03-15
expires: 2027-03-15
confidence: high
category: PATTERN
---

# Dual-Audit Gate for Research Documents Catches Critical Errors

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

After compiling a comprehensive technology research document from
multiple researcher agent outputs, the document needed validation
before it could be used as the foundation for the project
constitution. The research covered game engines, frontend stack,
deployment, authentication, real-time communication, state
management, architecture, and cost analysis.

### Discovery

Running two audits in parallel (Phase 1 -- read-only) is far
more effective than a single audit:

**Internal consistency audit** (@quality-auditor) found:
- Dockerfile `npm ci --only=production` would fail at build
  (devDeps needed for TypeScript/Next.js compilation)
- RLS policy referenced a table (`game_results`) not in the
  database schema (should have been `match_history`)
- Growth phase cost totals were wrong by $22
- Dockerfile didn't account for Turborepo monorepo structure
- Missing `proxy.ts` from directory structure (Next.js 16 rename)

**External accuracy audit** (@researcher) found:
- Node.js release date was wrong (Feb 24, not March 5)
- shadcn/ui GitHub stars had surpassed the stated range
- Verified 69 claims against authoritative sources (96% accurate)

The two audits catch fundamentally different classes of errors.
Internal audit catches self-contradictions; external audit catches
claims that don't match reality. Neither alone is sufficient.

### Solution/Decision

**PATTERN**: Every research document MUST go through a dual-audit
gate before being used for downstream decisions:

1. Launch @quality-auditor (internal consistency) and @researcher
   (external accuracy verification) in **parallel** (Phase 1)
2. Fix all CRITICAL issues immediately
3. Fix all MODERATE issues
4. Document LOW issues
5. Maximum 3 fix-audit cycles before escalating to user

This follows ByteDragon two-phase model: both audits are read-only
(Phase 1 parallel safe). Fixes are sequential (Phase 2).

### References

- `.bytedragon/TECH_RESEARCH.md` - The audited research document
- `.specify/memory/constitution.md` - Downstream consumer that
  relies on research accuracy

### Impact

The dual audit caught 2 critical issues (Dockerfile build failure,
SQL error), 4 moderate issues, and 7 low issues before they could
propagate into the constitution or future implementation work.
The Dockerfile fix alone would have blocked the entire deployment
pipeline if missed.
