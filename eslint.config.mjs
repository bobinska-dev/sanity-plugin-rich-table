import path from 'node:path'
import {fileURLToPath} from 'node:url'

import {fixupConfigRules} from '@eslint/compat'
import {FlatCompat} from '@eslint/eslintrc'
import js from '@eslint/js'
import globals from 'globals'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      '**/*.js',
      '**/.claude/**',
      '**/.eslintrc.js',
      '**/commitlint.config.js',
      '**/dist/**',
      '**/docs/**',
      '**/lint-staged.config.js',
      '**/package.config.ts',
      '**/scripts/**',
      '**/studio/**',
    ],
  },
  js.configs.recommended,
  ...fixupConfigRules(
    compat.extends(
      'sanity/typescript',
      'sanity/react',
      'plugin:react-hooks/recommended',
      'plugin:prettier/recommended',
      'plugin:react/jsx-runtime',
    ),
  ),
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        globalThis: 'readonly',
      },
    },
  },
  {
    // Disable two aspirational rules the codebase intentionally doesn't follow —
    // they only ever emitted warnings (never enforced) and dominated the lint
    // output. On React 19 + the React Compiler, inline JSX handlers are
    // auto-memoized (so `jsx-no-bind`'s perf rationale is moot), and component/
    // function return types are reliably inferred (so explicit boundary types add
    // noise without safety). Real correctness rules stay on.
    rules: {
      'react/jsx-no-bind': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    // Guard against the default styled-components import (regressed twice:
    // fixed in v1.0.5 via #6, reintroduced in 1.2.x, fixed again via #42).
    // styled-components v6 has no `exports` map, so under Node's native ESM
    // runtime the default binding resolves to the whole CJS module.exports
    // object and the plugin crashes at import time. The named export is safe.
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            // Carried over from eslint-config-sanity, which this block would
            // otherwise clobber (flat-config last-wins).
            {name: 'underscore'},
            {name: 'jquery'},
            {
              name: 'styled-components',
              importNames: ['default'],
              message:
                "Use the named import — import {styled} from 'styled-components' — the default import crashes under Node ESM (see #6, #42).",
            },
          ],
        },
      ],
    },
  },
  {
    // Test assertions frequently reach into PortableText block internals
    // (a `string | PortableTextBlock[]` union) to inspect children/marks, where
    // precise typing adds noise without value. Relax `no-explicit-any` for tests
    // only — shipped source stays strict.
    files: ['**/__tests__/**', '**/*.test.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
