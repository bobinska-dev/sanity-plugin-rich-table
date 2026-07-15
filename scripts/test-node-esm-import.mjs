#!/usr/bin/env node
/**
 * Smoke-tests that the built dist is importable under Node's native ESM
 * runtime. Guards against CJS→ESM interop breaks — e.g. the default
 * styled-components import that crashed the package at module scope
 * (issues #6 and #42). Bundlers paper over this, so only a real
 * `node --import` catches it.
 *
 * Run from repo root after `pnpm build`: node scripts/test-node-esm-import.mjs
 */

import path from 'node:path'
import {fileURLToPath, pathToFileURL} from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

try {
  // pathToFileURL: bare absolute paths break dynamic import() on Windows
  // (ERR_UNSUPPORTED_ESM_URL_SCHEME — drive letters parse as URL schemes).
  const mod = await import(pathToFileURL(path.join(root, 'dist/index.js')).href)
  if (typeof mod.richTablePlugin !== 'function') {
    console.error('FAIL: dist/index.js imported, but the richTablePlugin export is missing.')
    process.exit(1)
  }
  console.log('OK: dist/index.js imports cleanly under Node ESM.')
} catch (err) {
  console.error('FAIL: importing dist/index.js under Node ESM threw:\n')
  console.error(err)
  process.exit(1)
}
