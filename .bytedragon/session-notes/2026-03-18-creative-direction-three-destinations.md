---
created: 2026-03-18
expires: 2027-09-18
confidence: high
category: DECISION
---

# Creative Direction Splits Into Three Destinations

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

The project adopted a cell-shaded/comic-book art style (similar
to Borderlands). The creative-specialist produced a comprehensive
Phase 1 creative direction analysis. The question arose: where
does this information live? TECH_RESEARCH? Constitution? Vision
documents? A new standalone document?

### Discovery

No single destination works for all creative direction content.
Art style decisions contain three fundamentally different types
of information:

1. **Technology decisions** — Rendering pipeline, asset formats,
   sprite resolutions, animation approach, tool choices. These
   are the same class of decision as "use PostgreSQL" or "use
   Vitest" — they belong alongside other technology choices.

2. **Governance principles** — "Assets must be visually
   consistent" and "visual identity must survive shader removal"
   are constraints that ALL development must follow. They are
   the same class of rule as "no barrel files" or "zero-trust
   frontend."

3. **Full specifications** — Color palettes, outline weights,
   shading techniques, VFX catalogs, per-piece art requirements.
   These are too detailed for TECH_RESEARCH or the constitution
   and need their own reference document.

### Solution/Decision

DECISION: Creative direction splits into three destinations:

| Content Type | Destination | Example |
|-------------|-------------|---------|
| Technical rendering decisions | TECH_RESEARCH.md | PostFX pipeline, PNG+JSON atlas, 48x48 sprites |
| Governance constraints | Constitution | Art style consistency, graceful degradation |
| Full visual specifications | Standalone reference doc | Color palettes, VFX catalog, per-piece specs |

Individual vision pieces then reference the standalone guide for
their specific art requirements (e.g., "see art-style-guide.md
for tileset style specifications").

The quality-auditor validated this split: TECH_RESEARCH items are
technology decisions, constitution items are enforceable principles
(MUST/SHOULD/MAY), and the guide centralizes specifications per
Constitution Principle IV (Centralized Branding).

### References

- `.bytedragon/TECH_RESEARCH.md` — Visual Rendering Pipeline
  section (technology decisions)
- `.specify/memory/constitution.md` — Principles XXIX (Art Style
  Consistency) and XXXIII (Graceful Visual Degradation)
- `.bytedragon/vision/killer-vs-fed-roguelite/art-style-guide.md`
  — Standalone reference document (full specifications)

### Impact

Established the pattern for how creative direction integrates with
the existing governance architecture. Future creative decisions
(e.g., audio direction, narrative style) should follow the same
three-destination split: technical specs in TECH_RESEARCH,
governance principles in the constitution, and full specifications
in a standalone reference document.
