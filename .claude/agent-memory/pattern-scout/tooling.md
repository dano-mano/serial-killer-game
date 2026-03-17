---
name: tooling
description: Speckit workflow toolchain, available commands, template patterns, and process decisions
type: project
---

**Why:** Speckit is the spec-driven development workflow for this project. All feature work goes through it.

**How to apply:** When reporting workflow recommendations to orchestrator, use speckit command names and directory conventions.

## Speckit Version
v0.3.0, Claude AI with skills enabled (`.specify/init-options.json`)

## Command Flow
```
/speckit.specify  → specs/[###-feature]/spec.md
/speckit.clarify  → resolve ambiguities in spec
/speckit.plan     → specs/[###-feature]/plan.md + research.md + data-model.md + quickstart.md + contracts/
/speckit.analyze  → cross-artifact consistency check
/speckit.tasks    → specs/[###-feature]/tasks.md
/speckit.implement → execute tasks
/speckit.checklist → quality checklists
/speckit.constitution → amend governance
/speckit.taskstoissues → convert to GitHub issues
```

## Feature Directory Convention
`specs/[###-feature-name]/` with sequential numbering

## Constitution Amendment Pattern (DECISION from session note)
Must follow: @architect -> @quality-auditor -> fix (max 3 cycles) -> `/speckit.constitution`
Single architect draft is insufficient — audit catches gaps. This is mandatory.

## Dual-Audit Pattern for Research (PATTERN from session note)
Every research document needs TWO parallel audits:
1. @quality-auditor (internal consistency)
2. @researcher (external accuracy verification)
Previously caught broken Dockerfile, wrong SQL table reference, wrong cost totals.

## Task Format
`[ID] [P?] [Story] Description`
- `[P]` = parallel-safe (different files, no dependencies)
- Story label = US1, US2, etc.
- Phase order: Setup -> Foundational (blocking) -> User Stories -> Polish
- Tests FIRST (must fail before implementation)
