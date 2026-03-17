---
created: 2026-03-16
expires: 2027-03-16
confidence: high
category: GOTCHA
---

# Tailwind v4 @theme inline Required for Runtime Theme Switching

## Sanitization Checklist (MANDATORY)

**Complete before saving**:
- [x] No API keys, tokens, or credentials
- [x] No customer data or personally identifiable information (PII)
- [x] No internal URLs or infrastructure details
- [x] No proprietary business logic or trade secrets
- [x] Only public or project-local information included

---

## Category: GOTCHA

### Context

Designing the ui-theme package's bridge to Tailwind CSS v4 for this
project's monorepo. The reference project (byte-dragon-website) uses
a centralized branding system with CSS custom properties consumed by
Tailwind v4.

### Discovery

Tailwind CSS v4 has TWO `@theme` directives with critically different
behavior:

- `@theme { }` — resolves values at BUILD TIME. CSS custom properties
  are inlined as static values. Dark mode class-based switching will
  NOT work because the values are baked in.

- `@theme inline { }` — keeps CSS custom properties as DYNAMIC
  references at runtime. The browser resolves them based on the
  current DOM state (e.g., `.dark` class on `<html>`). This is
  required for any runtime theme switching (dark mode, user
  preferences, etc.).

The reference project uses `@theme inline { }` in its `globals.css`
to import CSS custom properties from the branding directory. The
branding CSS files define variables that change based on class-based
selectors (`:root` vs `.dark`).

### Solution/Decision

**GOTCHA**: When scaffolding the ui-theme → Tailwind v4 bridge:

1. ALWAYS use `@theme inline { }` (not `@theme { }`) in the CSS
   entry point
2. Define design tokens as CSS custom properties in the ui-theme
   package
3. Import those properties into `globals.css` via `@import`
4. Reference them in `@theme inline { }` for Tailwind to consume
5. Dark mode uses class-based switching on `<html>` element

This is easy to get wrong because `@theme` (without `inline`) appears
to work during development — the issue only manifests when you try to
switch themes at runtime and nothing changes.

### References

- `.bytedragon/TECH_RESEARCH.md` - ui-theme bridge architecture
  (see ui-theme and Tailwind CSS v4 discussion)
- `.specify/memory/constitution.md` - Principle IV: Centralized
  Branding & Design Tokens (see Requirements section)

### Impact

Critical for scaffolding the ui-theme package correctly on the first
attempt. Without `inline`, dark mode and any runtime theme switching
would silently fail, requiring a rearchitecture of the CSS layer.
