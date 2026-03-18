---
name: constitution-renumbering-propagation
description: Recurring issue -- constitution amendments that renumber principles leave stale references in CLAUDE.md, TECH_RESEARCH.md, and vision docs. Check ALL downstream docs after every amendment.
type: project
---

Downstream principle-number staleness has occurred in BOTH v1.1.0 and v1.2.0 amendments. This is a recurring pattern, not a one-time oversight.

- v1.1.0: Researcher outputs used v1.0.0 numbers; implementation-specialist propagated stale refs into TECH_RESEARCH.md
- v1.2.0: CLAUDE.md, TECH_RESEARCH.md, and 9 vision doc references still use v1.1.0 numbers after renumbering XXIX-XXXI -> XXX-XXXII

**Why:** No automated cross-reference validation exists. Each amendment relies on manual grep-and-fix, which is error-prone when vision docs accumulate references.

**How to apply:** After any constitution amendment that adds/removes/renumbers principles, grep the entire repo for affected Roman numerals and audit ALL hits: CLAUDE.md, TECH_RESEARCH.md, vision docs, agent memory files, session notes. Consider recommending principle references by NAME rather than number to reduce future breakage (last seen 2026-03-18).
