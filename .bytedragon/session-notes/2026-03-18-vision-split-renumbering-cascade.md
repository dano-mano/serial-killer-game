---
created: 2026-03-18
expires: 2027-03-18
confidence: high
category: PATTERN
---

# Vision Scope Splitting Requires Multi-Pass Renumbering Cascade

## Sanitization Checklist (MANDATORY)

**Complete before saving**:
- [x] No API keys, tokens, or credentials
- [x] No customer data or personally identifiable information (PII)
- [x] No internal URLs or infrastructure details
- [x] No proprietary business logic or trade secrets
- [x] Only public or project-local information included

---

## Category: PATTERN

### Context

Splitting 4 over-scoped vision pieces into 8 sub-pieces and
renumbering the full sequence from 15 to 19 documents. This is
the vision-document equivalent of the constitution renumbering
cascade documented in `2026-03-16-constitution-renumbering-cascade.md`.

### Discovery

Vision renumbering is MORE complex than constitution renumbering
because of the self-containment rule. Each vision document inlines
full dependency details, meaning the same artifact (e.g., a database
schema or type definition) may be duplicated across many documents.
The cascade has multiple layers that are easy to miss:

1. **Filenames** — Obvious. Rename files to new NN_ prefix.
2. **YAML frontmatter** — `sequence:` and `depends_on:` fields.
   Agents reliably fix these.
3. **Supplemental sections** — Dependencies, Alignment Notes.
   These reference piece numbers. Agents usually fix these.
4. **Body text in UNCHANGED files** — Files that were NOT renamed
   still contain prose references like "piece 09" that are now
   stale. This is the most commonly missed layer. The renumbering
   agent focused on renamed files and skipped unchanged ones.
5. **Reference documents** — art-style-guide.md per-piece table
   uses piece numbers. Easy to miss.

The quality-auditor caught layer 4 (11 stale body-text references
in files 02, 03, 05, 06, 07) that the renumbering agent missed.
Without the audit, these would have been silent errors causing
confusion during `/speckit.specify` execution.

### Solution/Decision

PATTERN: Vision renumbering requires this agent pipeline:

1. **Knowledge-keeper**: Rename files + update YAML + update
   supplemental sections + update reference docs
2. **Quality-auditor**: Search ALL files (including unchanged ones)
   for stale piece-number references
3. **Knowledge-keeper**: Fix stale references found by audit
4. **Quality-auditor**: Verify fixes (often catches 1-2 more)

The key insight: step 2 MUST search unchanged files, not just
the renamed ones. The renumbering map must be provided to the
quality-auditor so it can distinguish correct from stale numbers.

### References

- `.bytedragon/vision/killer-vs-fed-roguelite/` — 19 vision docs
  (renumbered from letter-suffix to sequential integers)
- Related: `2026-03-16-constitution-renumbering-cascade.md` — Same
  pattern for constitution principles
- Related: `2026-03-18-vision-integer-only-sequences.md` — Why
  letter suffixes were abandoned

### Impact

Established the multi-pass pipeline for vision renumbering.
The "unchanged files with stale body text" gotcha should be
explicitly called out in any future renumbering delegation prompt.
