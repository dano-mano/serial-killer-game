---
created: 2026-03-15
expires: 2027-03-15
confidence: high
category: DECISION
---

# Constitution Creation Requires Architect -> Audit -> Fix -> Ratify

## Sanitization Checklist (MANDATORY)

**Complete before saving**:
- [x] No API keys, tokens, or credentials
- [x] No customer data or personally identifiable information (PII)
- [x] No internal URLs or infrastructure details
- [x] No proprietary business logic or trade secrets
- [x] Only public or project-local information included

---

## Category: DECISION

### Context

Creating the project's first constitution (v1.0.0, 29 principles
across 6 sections) from technology research. The speckit system
provides the `/speckit.constitution` command for writing the
constitution, but the design of the principles themselves requires
a multi-agent pipeline to achieve production quality.

### Discovery

A single architect agent designing the constitution produced a
solid draft (27 principles), but the quality-auditor found 5
moderate gaps that would have weakened the governance document:

1. Testing tools listed in the header had not been researched
2. Missing principle for Node.js runtime version consistency
3. Missing principle for observability/error tracking
4. Vague, untestable language in database schema principle
5. Test organization principle only covered file location, not
   test quality standards

These are the kinds of gaps that compound over time -- a
constitution missing an observability principle means every
future spec and plan lacks observability guidance.

### Solution/Decision

**DECISION**: Constitution creation/amendment MUST follow this
3-agent sequential pipeline (Phase 2 -- write operations):

1. **@architect** designs principles from research inputs
2. **@quality-auditor** audits the draft for:
   - Testability and enforceability of each principle
   - Technology alignment with TECH_RESEARCH.md
   - Gaps in coverage (security, quality, architecture)
   - MUST/SHOULD/MAY language consistency
   - Non-stale values (no line counts, hardcoded versions)
3. **Orchestrator** applies audit fixes (max 3 cycles)
4. **Orchestrator** executes `/speckit.constitution` to ratify

The audit step is NOT optional. It follows ByteDragon 1:1
cardinality -- the architect's write output gets exactly one
quality audit before ratification.

### References

- `.specify/memory/constitution.md` - The ratified constitution
  (see Governance section for amendment process)
- `.claude/commands/speckit.constitution.md` - The speckit
  command that handles the 8-step write workflow

### Impact

Established the quality-gated pattern for all future constitution
work. The 5 gaps caught by the auditor were incorporated before
ratification, resulting in a stronger governance foundation (29
principles vs the initial 27).
