---
name: constitution-renumbering-propagation
description: Recurring issue -- constitution amendments that renumber principles leave stale references in CLAUDE.md, TECH_RESEARCH.md, and vision docs. Check ALL downstream docs after every amendment.
type: project
---

Downstream principle-number staleness has occurred in ALL THREE amendments (v1.0.0 -> v1.1.0 -> v1.2.0). This is a systemic pattern, not an oversight.

- v1.1.0: Researcher outputs used v1.0.0 numbers; implementation-specialist propagated stale refs into TECH_RESEARCH.md
- v1.2.0: CLAUDE.md, TECH_RESEARCH.md, and 9 vision doc references still use v1.1.0 numbers after renumbering XXIX-XXXI -> XXX-XXXII
- v1.2.0 (baseline audit): Pattern-scout agent memory still describes itself as v1.1.0 (31 principles) and references "Principle XXXI" for Asset Loading (now XXXII). CLAUDE.md and TECH_RESEARCH.md were fixed, but agent memory files were missed.

**Why:** No automated cross-reference validation exists. Each amendment relies on manual grep-and-fix, which is error-prone. Agent memory files are an additional propagation surface that is easy to overlook.

**How to apply:** After any constitution amendment that adds/removes/renumbers principles, grep the entire repo for affected Roman numerals and audit ALL hits: CLAUDE.md, TECH_RESEARCH.md, vision docs, agent memory files (all agents, not just quality-auditor), session notes. Strongly recommend principle references by NAME rather than number to reduce future breakage (last seen 2026-03-18).
