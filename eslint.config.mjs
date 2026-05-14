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
    rules: {
      // React Compiler rule - disable for Sanity plugin patterns
      'react-hooks/preserve-manual-memoization': 'off',
    },
  },
  // Test file overrides - must come after main rules
  {
    files: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/*.test.ts', '**/*.test.tsx'],
    rules: {
      'max-nested-callbacks': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
