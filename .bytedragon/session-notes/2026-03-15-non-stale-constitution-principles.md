---
created: 2026-03-15
expires: 2027-03-15
confidence: high
category: PATTERN
---

# Constitution Principles Must Be Generic and Non-Stale

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

When creating the project's first constitution, Dan emphasized
that all principles and amendments must be written for long-term
durability. The constitution governs all development -- if its
principles contain values that become stale, they stop being
useful or actively mislead.

### Discovery

Dan identified several categories of content that become stale
quickly and MUST be avoided in constitution principle bodies:

**Values that become stale:**
- Specific line counts or file sizes
- Code snippets (unless purely illustrative patterns)
- Test counts or coverage percentages
- Specific version numbers in principle text
- Specific file paths that will change as features are built

**Values that stay durable:**
- Directory patterns using `[domain]/` notation
- MUST/SHOULD/MAY behavioral rules (RFC 2119 style)
- Architectural patterns described by name
- Rationale explaining WHY a principle exists
- Enforcement mechanisms (what tool/process catches violations)

### Solution/Decision

**PATTERN**: Constitution principles follow these durability rules:

1. Use `[domain]/` pattern notation for directory paths, not
   concrete paths (e.g., `config/[domain]/` not
   `config/database/env.ts`)
2. Version numbers belong ONLY in the Sync Impact Report header
   (HTML comment) under "Technology Decisions" -- never in
   principle bodies
3. Principles must be testable with a yes/no answer (no vague
   "should try to" language)
4. Focus on behaviors and constraints, not implementation details
5. Game-specific mechanics are NOT in the constitution (it must
   work for any game design layered on top)

The quality auditor specifically checks for stale values during
constitution audits. It flagged "Phaser (~1.2MB raw)" as a value
that would drift with future versions -- replaced with "the game
engine bundle."

### References

- `.specify/memory/constitution.md` - The constitution following
  these durability rules (see any principle for examples of
  `[domain]/` pattern usage)
- `.claude/commands/speckit.constitution.md` - The command
  workflow (see Step 6: validation checks for vague language)

### Impact

The constitution's 29 principles are written to remain accurate
regardless of which game mechanics, database tables, routes, or
features are added. This means the constitution should rarely
need PATCH amendments for staleness -- only MINOR amendments for
genuinely new principles or expanded guidance.
