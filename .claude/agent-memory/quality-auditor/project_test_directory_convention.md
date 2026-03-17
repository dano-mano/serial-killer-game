---
name: test-directory-convention
description: Constitution XXVI requires tests/ at package root, NOT co-located in src/. Vitest include patterns must use tests/**/*.test.ts.
type: project
---

Constitution v1.1.0 Principle XXVI mandates a centralized `tests/` directory at each package root, sibling to `src/`. Test files MUST NOT be co-located with source files.

**Why:** The researcher outputs and some reference projects use co-located tests (`src/**/*.test.ts`). The constitution was amended to require centralized test directories for auditability and clean source directories.

**How to apply:** When reviewing vitest.config.mts files, verify the `include` pattern uses `tests/**/*.test.ts` not `src/**/*.test.ts`. When reviewing file structure examples, verify test files appear under `tests/` not under `src/`.
