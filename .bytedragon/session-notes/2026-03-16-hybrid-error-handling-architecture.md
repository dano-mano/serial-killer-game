---
created: 2026-03-16
expires: 2027-03-16
confidence: high
category: DECISION
---

# Hybrid Error Handling Across Three-Layer Architecture

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

The project has a three-layer architecture (Phaser game engine →
Zustand stores → React/Supabase) that requires errors to propagate
cleanly across layers with different runtime constraints. The game
engine cannot depend on React. Server Actions need typed return
values. React components need error boundaries.

### Discovery

No single error handling approach works across all three layers:

- **Thrown exceptions** work in React (error boundaries catch them)
  but are invisible in Phaser's game loop (uncaught → silent failure)
- **Result types** work everywhere but require callers to handle
  both paths explicitly, which is verbose in React components
- **Server Action return values** need a structured format that
  integrates with form state and revalidation

The key insight: each layer has a natural error model. Forcing a
single model across all layers creates friction and bugs.

### Solution/Decision

**DECISION**: Hybrid error handling with three patterns matched to
three layers:

1. **DAL functions + game engine logic**: `neverthrow` Result<T, E>
   - Works without React dependency (critical for game engine)
   - Forces explicit error handling at call sites
   - Shared AppError type in packages/shared
   - DAL functions return `Result<DTO, AppError>`
   - Game systems return `Result<GameState, GameError>`

2. **Server Actions**: `next-safe-action`
   - Integrates Zod validation with typed action results
   - Returns `{ data, serverError, validationErrors }` structure
   - Works with React form state (useActionState)
   - Calls DAL functions internally and converts Result → action response

3. **React components**: `error.tsx` error boundaries
   - Catches uncaught exceptions at route segment level
   - Zustand store actions convert Result errors → thrown exceptions
     when they need to trigger error boundaries
   - Optimistic UI reverts on error via Zustand rollback

**Error flow across layers**:
- Phaser scene → calls game system → gets Result → handles in game loop
- React component → calls Server Action → gets typed response → updates UI
- Zustand store → subscribes to Supabase Realtime → converts errors → notifies both layers

### References

- `.bytedragon/TECH_RESEARCH.md` - Logging & Error Handling section
  (see Hybrid Error Handling Pattern)
- `.specify/memory/constitution.md` - Principle X: Observability
  (errors must not be silently swallowed)
- `packages/shared/` - Where shared AppError type will live
  (see types/ directory per Principle III)

### Impact

Established the error handling architecture before any code is
written. Each layer uses its natural error model, with clean
conversion points between them. Prevents the common pattern of
choosing one approach and discovering it doesn't work in another
layer midway through implementation.
