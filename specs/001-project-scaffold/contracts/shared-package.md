# Contract: @repo/shared Package Public Surface

**Branch**: `001-project-scaffold` | **Date**: 2026-03-18

## Overview

The `@repo/shared` package is the shared dependency consumed by both `apps/web` and `packages/game-engine`. It exposes types, schemas, constants, and utilities via the `exports` field in `package.json`. No barrel files -- each export maps to an actual source file.

## Package Exports

```jsonc
// packages/shared/package.json (exports field)
{
  "exports": {
    "./types/common": "./src/types/common.ts",
    "./schemas/common": "./src/schemas/common.ts",
    "./constants/errors": "./src/constants/errors.ts",
    "./utils/result": "./src/utils/result.ts"
  }
}
```

## Import Contract

Consumers import via subpath exports:

```typescript
// In apps/web or packages/game-engine:
import type { ID, Timestamp, BaseDto } from '@repo/shared/types/common'
import { idSchema, paginationSchema } from '@repo/shared/schemas/common'
import { ErrorCategory } from '@repo/shared/constants/errors'
import { ok, err, type AppError } from '@repo/shared/utils/result'
```

## Exported Symbols

### `@repo/shared/types/common`
| Export | Kind | Description |
|--------|------|-------------|
| `ID` | Type alias | `string` (UUID v4 format) |
| `Timestamp` | Type alias | `string` (ISO 8601 datetime) |
| `BaseDto` | Interface | `{ id: ID, createdAt: Timestamp, updatedAt: Timestamp }` |

### `@repo/shared/schemas/common`
| Export | Kind | Description |
|--------|------|-------------|
| `idSchema` | Zod schema | Validates UUID v4 string |
| `timestampSchema` | Zod schema | Validates ISO 8601 datetime string |
| `paginationSchema` | Zod object | `{ limit: number, offset: number }` with defaults and bounds |

### `@repo/shared/constants/errors`
| Export | Kind | Description |
|--------|------|-------------|
| `ErrorCategory` | Enum/const object | `VALIDATION`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `DATABASE`, `INTERNAL` |

### `@repo/shared/utils/result`
| Export | Kind | Description |
|--------|------|-------------|
| `ok` | Function | Creates success Result |
| `err` | Function | Creates failure Result |
| `AppError` | Class/interface | Typed error with category, message, optional code and cause |
| `AppError.validation` | Factory | Creates validation error |
| `AppError.notFound` | Factory | Creates not-found error |
| `AppError.unauthorized` | Factory | Creates unauthorized error |
| `AppError.forbidden` | Factory | Creates forbidden error |
| `AppError.database` | Factory | Creates database error |
| `AppError.internal` | Factory | Creates internal error |
| `Result` | Type | Re-exported from neverthrow |
| `ResultAsync` | Type | Re-exported from neverthrow |

## Stability

All exports in this scaffold are **stable foundation types**. They will be extended (new exports added) by subsequent features but the existing surface will not change. Breaking changes to base types would cascade across all consumers.

## Constraints

- MUST NOT depend on React, Next.js, Phaser, or any framework
- MUST NOT depend on Node.js-specific APIs (must work in both browser and server)
- MUST NOT use barrel files (each export subpath maps to one source file)
- Zod is the only runtime dependency
- neverthrow is the only other runtime dependency (re-exported via utils/result)
