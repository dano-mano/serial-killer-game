// @ts-check
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * ESLint flat config for the monorepo.
 *
 * Rule philosophy:
 * - No barrel files: Constitution Principle I (direct imports enforced everywhere)
 * - No process.env: Constitution Principle II (all env through config/env.ts)
 * - No vendor imports: Constitution Principle V (feature code imports from app/ not vendor/)
 * - Must-use-result: all neverthrow Results must be handled
 * - React Compiler: enables React 19 compiler optimizations
 */

// eslint-config-next exports flat config arrays directly (already flat config)
const nextCoreWebVitals = require('eslint-config-next/core-web-vitals')
const nextTypescript = require('eslint-config-next/typescript')
const noBarrelFiles = require('eslint-plugin-no-barrel-files')
const neverthrowOriginal = require('eslint-plugin-neverthrow')
const pluginN = require('eslint-plugin-n')
const tsParser = require('@typescript-eslint/parser')

// react-compiler is ESM only
const reactCompilerPlugin = await import('eslint-plugin-react-compiler')
const reactCompiler = reactCompilerPlugin.default ?? reactCompilerPlugin

/**
 * Compatibility shim for eslint-plugin-neverthrow@1.1.4 on ESLint 9.
 *
 * eslint-plugin-neverthrow uses context.parserServices (ESLint 7/8 API).
 * ESLint 9 moved parserServices to context.sourceCode.parserServices.
 * This proxy shim bridges the old API call to the new location.
 */
const neverthrow = {
  ...neverthrowOriginal,
  rules: {
    'must-use-result': {
      ...neverthrowOriginal.rules['must-use-result'],
      create(context) {
        const shimmedContext = new Proxy(context, {
          get(target, prop) {
            if (prop === 'parserServices') {
              return target.sourceCode?.parserServices
            }
            const value = target[prop]
            return typeof value === 'function' ? value.bind(target) : value
          },
        })
        return neverthrowOriginal.rules['must-use-result'].create(shimmedContext)
      },
    },
  },
}

/** @type {import('eslint').Linter.Config[]} */
const config = [
  // Global ignores — must be in its own config object with no other properties
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.d.ts',
    ],
  },

  // Next.js core-web-vitals + TypeScript: React, hooks, a11y, import rules
  ...nextCoreWebVitals,
  ...nextTypescript,

  // Non-Next.js packages: disable rules that expect a pages/ directory
  {
    files: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },

  // Rules for all JavaScript and TypeScript files (non-type-aware)
  {
    plugins: {
      'react-compiler': reactCompiler,
      'no-barrel-files': noBarrelFiles,
      n: pluginN,
    },
    rules: {
      // React Compiler enforcement — catches components that violate React's rules of hooks
      'react-compiler/react-compiler': 'warn',

      // Constitution Principle I: No barrel files
      // File-level overrides below exempt package entry points and utility re-exports
      'no-barrel-files/no-barrel-files': 'error',

      // Constitution Principle II: No direct process.env access
      // File-level override below exempts **/config/**
      'n/no-process-env': 'error',

      // Constitution Principle X: Use Pino logger, not console
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Constitution Principle V: Feature code imports from app/ layers, never vendor directly
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/components/vendor/**'],
              message:
                'Import from components/app/ wrappers instead of vendor components directly. ' +
                'Vendor components (shadcn/ui, Magic UI) are immutable — wrap them in components/app/.',
            },
          ],
        },
      ],
    },
  },

  // Type-aware rules for TypeScript source files only (not config/test files)
  // neverthrow/must-use-result requires TypeScript types to detect Result return types
  // Uses a compatibility shim to work with ESLint 9 + typescript-eslint 8.x
  {
    files: [
      'apps/*/src/**/*.ts',
      'apps/*/src/**/*.tsx',
      'packages/*/src/**/*.ts',
      'packages/*/src/**/*.tsx',
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      neverthrow,
    },
    rules: {
      // neverthrow: Result values must be handled — prevents silently swallowed errors
      'neverthrow/must-use-result': 'error',
    },
  },

  // Exception: package entry points are allowed to re-export (they ARE the barrel by design)
  {
    files: ['packages/*/src/index.ts'],
    rules: {
      'no-barrel-files/no-barrel-files': 'off',
    },
  },

  // Exception: packages/shared/src/utils/result.ts re-exports ok/err/Result from neverthrow.
  // This is not a barrel file — it's the implementation file that also proxies the neverthrow
  // public API so consumers have a single import point for the Result pattern utilities.
  {
    files: ['packages/shared/src/utils/result.ts'],
    rules: {
      'no-barrel-files/no-barrel-files': 'off',
    },
  },

  // Exception: config directory is the only place process.env is permitted
  {
    files: ['**/config/**'],
    rules: {
      'n/no-process-env': 'off',
    },
  },

  // Exception: next.config.ts needs process.env for build-time checks
  {
    files: ['**/next.config.ts', '**/next.config.mjs'],
    rules: {
      'n/no-process-env': 'off',
    },
  },

  // Exception: instrumentation-client.ts is a client-side Sentry init file.
  // It cannot import env.ts (server-only) so it must use NEXT_PUBLIC_* directly.
  // This is the documented exception from the Sentry + Next.js integration pattern.
  // instrumentation.ts uses process.env.NEXT_RUNTIME to detect the Node.js runtime,
  // which is a Next.js-specific runtime variable not part of app configuration.
  {
    files: ['**/instrumentation-client.ts', '**/instrumentation.ts'],
    rules: {
      'n/no-process-env': 'off',
      'no-barrel-files/no-barrel-files': 'off',
    },
  },

  // Exception: Playwright config uses process.env.CI for CI-specific settings
  // (retry counts, worker counts). This is standard Playwright configuration practice.
  {
    files: ['**/playwright.config.ts'],
    rules: {
      'n/no-process-env': 'off',
    },
  },

  // Exception: proxy.ts uses process.env.NODE_ENV for CSP dev/prod branching.
  // proxy.ts cannot import from config/env.ts (circular dependency risk and
  // startup-time execution order). NODE_ENV is a well-known runtime constant,
  // not an application secret. This is the one allowed process.env access
  // outside the config/ directory.
  {
    files: ['**/proxy.ts'],
    rules: {
      'n/no-process-env': 'off',
    },
  },
]

export default config
