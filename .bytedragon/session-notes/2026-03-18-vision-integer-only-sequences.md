---
created: 2026-03-18
expires: 2027-03-18
confidence: high
category: GOTCHA
---

# Vision Documents Must Use Integer-Only Sequence Numbers

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

When splitting 4 over-scoped vision pieces (08, 10, 11, 13) into
8 sub-pieces, the initial approach used letter suffixes (08a, 08b,
10a, 10b, etc.) to avoid renumbering all downstream files. This
seemed safe because filenames sort correctly ("08a" < "08b" < "09"
lexicographically).

### Discovery

The `/vision-alignment` command uses bash integer comparison on the
YAML `sequence:` field:

```bash
if [ "$DOC_SEQ" -lt "$COMPLETED_SEQ" ] 2>/dev/null; then
```

Bash `-lt` is integer-only. "08a" is not a valid integer, so this
comparison would fail silently (the `2>/dev/null` suppresses the
error) or produce incorrect results. The sequential order check,
earlier-pieces-pending warning, and downstream document detection
all depend on integer comparison.

The vision piece template also explicitly defines the format as
"Two-digit zero-padded sequence number: 01, 02, 03, ..., 12" —
no letter suffixes.

### Solution/Decision

GOTCHA: When splitting vision pieces, ALWAYS renumber to clean
sequential integers. Never use letter suffixes (08a, 08b) even
though they sort correctly in filenames.

The renumbering cascade is more work upfront but is required for
`/vision-alignment` to function correctly.

### References

- `~/.claude/commands/vision-alignment.md` — Sequential Order
  Check section (bash `-lt` comparison)
- `~/.claude/docs/vision/vision-piece-template.md` — Filename
  format specification (two-digit zero-padded integers only)
- Related: `2026-03-16-constitution-renumbering-cascade.md`

### Impact

Required a full renumbering pass (12 file renames, all depends_on
updates, all body-text reference updates) after the initial
letter-suffix approach was identified as incompatible. Future
vision splits should renumber immediately rather than using
letter suffixes as an intermediate step.
