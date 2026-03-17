---
name: project_context
description: Project type, current status, what exists vs. what's planned to be built
type: project
---

Greenfield browser-based multiplayer video game (serial-killer-game). Game mechanics not yet defined.

**Why:** Foundation-first approach — governance and architecture ratified before any game design or code.

**How to apply:** Do not assume any gameplay, database tables, routes, or features exist. Constitution and TECH_RESEARCH.md are the authorities. Wait for game design before pattern-scouting application code.

## What Exists (governance artifacts only)
- `.specify/memory/constitution.md` — 29-principle governance document (v1.0.0, ratified 2026-03-15)
- `.bytedragon/TECH_RESEARCH.md` — Dual-audited technology research
- `CLAUDE.md` — Project instructions
- `.specify/` — Full speckit toolchain
- `.claude/commands/` — 9 speckit commands
- `.bytedragon/session-notes/` — 3 architectural decision notes

## What Does NOT Exist
- No package.json, no node_modules
- No apps/web/, packages/, supabase/
- No source code, no tests
- No game design or feature specs
- Testing tooling not decided (Vitest likely but unresearched)
