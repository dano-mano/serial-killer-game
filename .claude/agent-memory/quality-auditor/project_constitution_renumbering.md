---
name: constitution-renumbering-propagation
description: Constitution principle numbers changed in v1.1.0 -- researcher outputs and TECH_RESEARCH still reference old numbers. Check all cross-references after constitution amendments.
type: project
---

Constitution v1.1.0 renumbered principles XXII-XXIX due to two new insertions (XXII CSP, XXIV Dependency Management). Researcher outputs created before the amendment used v1.0.0 numbering. When implementation-specialist carried those references into TECH_RESEARCH.md, the old numbers persisted.

**Why:** The researcher ran before the constitution amendment. The implementation-specialist did not cross-check principle numbers against the current constitution.

**How to apply:** After any constitution amendment that adds/removes/renumbers principles, audit ALL downstream documents (TECH_RESEARCH.md, CLAUDE.md, agent outputs) for stale principle references. The most common mapping errors after v1.1.0:
- Old XXIV (Test Organization) -> New XXVI
- Old XXVI (Accessibility) -> New XXVIII
