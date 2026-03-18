---
name: project_context
description: Project type, current status, what exists vs. what's planned to be built
type: project
---

Greenfield browser-based asymmetric roguelite game — "Serial Killer vs. Fed". One player hunts targets while evading detection; the other investigates crime scenes to identify and arrest the killer. Both players disguised among NPCs.

**Why:** Foundation-first approach — governance and architecture ratified before game design. Game design vision (15 pieces) completed 2026-03-17.

**How to apply:** No application code exists yet. First implementation is piece 01 (project-scaffold). Constitution v1.1.0 and TECH_RESEARCH.md are the authorities for all architecture decisions.

## What Exists (governance + vision artifacts only)
- `.specify/memory/constitution.md` — 31-principle governance document (v1.1.0, updated 2026-03-16)
- `.bytedragon/TECH_RESEARCH.md` — Full technology research (tested and dual-audited)
- `CLAUDE.md` — Project instructions with architecture overview
- `.specify/` — Full speckit toolchain (v0.3.0)
- `.claude/commands/` — 9 speckit commands
- `.bytedragon/session-notes/` — 6 architectural decision notes
- `.bytedragon/vision/killer-vs-fed-roguelite/` — 15 vision documents (01-15), complete game design
- `.bytedragon/next-session/2026-03-17-200521/CONTEXT.md` — Full session summary with decisions

## What Does NOT Exist
- No package.json, no node_modules
- No apps/web/, packages/, supabase/
- No source code, no tests
- No specs directory yet (speckit.specify not yet run)

## Next Implementation Step
Piece 01: project-scaffold. Vision document at `.bytedragon/vision/killer-vs-fed-roguelite/01_project_scaffold.md`.
Subsequent pieces 02, 03, 04 can be parallelized after 01 completes.

## Critical Warnings (from session context)
- Piece 09 depends on 08 (evidence system consumes combat events) — NOT parallelizable
- ContentRegistry<T> pattern (pieces 08+): use `DamageTypeId = string`, NOT hardcoded unions
- Ghost token scarcity intentional — don't add GT sources without balance review
- Boss item CUSTOM handlers require subsystem interfaces from earlier pieces
