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
