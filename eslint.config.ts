import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import {defineConfig} from 'eslint/config'

import simpleImportSort from 'eslint-plugin-simple-import-sort';
import reactHooks from 'eslint-plugin-react-hooks';

// TODO FIX ESLINT PLUGIN ISSUE WHEN BUILDING

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
 plugins: {
       js,
     //  'simple-import-sort': simpleImportSort
    },
    extends: [
      // 'js/recommended',
      'sanity',
      'sanity/react',
      'sanity/typescript',
      'plugin:react-hooks/recommended',
      'plugin:prettier/recommended',
      'plugin:react/jsx-runtime',
    ],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },

    ignores: [
      '**/*.js',
      '**/.eslintrc.js',
      '**/commitlint.config.js',
      '**/dist',
      '**/lint-staged.config.js',
      '**/package.config.ts',
    ],
  },
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  reactHooks.configs.flat.recommended
])
