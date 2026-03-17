---
created: 2026-03-16
expires: 2027-03-16
confidence: high
category: PATTERN
---

# Constitution Renumbering Cascades Into Downstream Documents

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

Amending the constitution from v1.0.0 to v1.1.0 required adding two
new principles in the middle of the numbering sequence (CSP in the
Security section, Dependency Management in the Quality section). This
caused all subsequent principles to shift by 1 or 2 positions.

### Discovery

The @architect correctly renumbered all principles within the
constitution itself and updated internal cross-references. However,
when @implementation-specialist updated TECH_RESEARCH.md with new
sections, it used principle references from the @researcher outputs
-- which had been written BEFORE the renumbering. The researcher
outputs referenced v1.0.0 principle numbers.

The @quality-auditor caught 3 incorrect principle references and 1
test directory organization contradiction in TECH_RESEARCH.md. All
were caused by stale v1.0.0 numbers propagated through the agent
pipeline.

### Solution/Decision

**PATTERN**: When amending the constitution with renumbering:

1. The @architect MUST output a renumbering map (old → new) as
   part of the amendment design
2. The orchestrator MUST include the renumbering map in ALL
   downstream agent prompts that reference principle numbers
3. Any agent writing content that references principles MUST use
   the new numbers, not numbers from earlier research outputs
4. The @quality-auditor MUST specifically check all principle
   references against the current constitution version

The renumbering map for v1.0.0 → v1.1.0:
- I-XXI: unchanged
- New XXII: Content Security Policy
- Old XXII (Zero Tech Debt) → XXIII
- New XXIV: Dependency Management
- Old XXIII-XXIX → XXV-XXXI

### References

- `.specify/memory/constitution.md` - The amended constitution
  (see Governance section for versioning policy)
- `.bytedragon/TECH_RESEARCH.md` - The downstream document where
  stale references were caught
- Related: `2026-03-15-constitution-creation-workflow.md`

### Impact

Prevented 3 incorrect principle references from being committed to
TECH_RESEARCH.md. Established the pattern that renumbering maps must
be explicitly passed through the agent pipeline. Future amendments
that add/remove principles should follow this pattern.
