#!/usr/bin/env node
/**
 * Tests installing sanity-plugin-rich-table in minimal Studio setups
 * for Sanity 3, 4, and 5. Exits 0 if all installs succeed; prints summary.
 * Run from repo root: node scripts/test-studio-install.mjs
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const testDir = path.join(root, 'tmp-studio-install-test');

const STUDIOS = [
  {
    name: 'Sanity 3 (3.56)',
    deps: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      sanity: '^3.56.0',
      'styled-components': '^6.1.0',
    },
  },
  {
    name: 'Sanity 4 (4.22)',
    deps: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      sanity: '^4.22.0',
      'styled-components': '^6.1.0',
    },
  },
  {
    name: 'Sanity 5 (5.11)',
    deps: {
      react: '^19.2.0',
      'react-dom': '^19.2.0',
      sanity: '^5.11.0',
      'styled-components': '^6.3.0',
    },
  },
];

function run(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', ...opts });
}

function main() {
  const useLegacyPeer = process.env.LEGACY_PEER !== '0';
  console.log('Testing plugin install across Sanity 3, 4, 5...');
  if (useLegacyPeer) console.log('(using npm --legacy-peer-deps so all versions can install)\n');
  else console.log('(strict peer deps – only Sanity 5 may pass)\n');

  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
  }
  fs.mkdirSync(testDir, { recursive: true });

  const tarball = path.join(root, 'sanity-plugin-rich-table-1.0.2.tgz');
  const pluginRef = fs.existsSync(tarball) ? `file:${tarball}` : 'sanity-plugin-rich-table';

  const results = [];

  for (const studio of STUDIOS) {
    const dir = path.join(testDir, studio.name.replace(/\s*\([^)]+\)/, '').replace(/\s+/g, '-').toLowerCase());
    fs.mkdirSync(dir, { recursive: true });

    const pkg = {
      name: 'test-studio',
      private: true,
      dependencies: {
        ...studio.deps,
        'sanity-plugin-rich-table': pluginRef,
      },
    };
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2));

    let ok = false;
    let stderr = '';
    let stdout = '';
    const npmCmd = useLegacyPeer ? 'npm install --legacy-peer-deps 2>&1' : 'npm install 2>&1';
    try {
      const out = run(npmCmd, { cwd: dir });
      stdout = out;
      ok = true;
    } catch (e) {
      stderr = e.stderr || e.stdout || e.message || '';
      stdout = e.stdout || '';
    }

    const hasPeerWarn = /peer dep|unmet peer|WARN.*peer/i.test(stdout + stderr);
    results.push({
      name: studio.name,
      ok,
      hasPeerWarn,
      stdout: stdout.slice(-2000),
      stderr: stderr.slice(-1000),
    });

    console.log(`${studio.name}: ${ok ? 'install OK' : 'install FAILED'}${hasPeerWarn ? ' (peer warnings)' : ''}`);
  }

  console.log('');
  const allOk = results.every((r) => r.ok);
  if (!allOk) {
    console.log('Details for failed installs:');
    results.filter((r) => !r.ok).forEach((r) => {
      console.log('\n---', r.name, '---');
      console.log(r.stderr || r.stdout);
    });
  }

  const withWarnings = results.filter((r) => r.hasPeerWarn);
  if (withWarnings.length) {
    console.log('\nPeer dependency warnings in:', withWarnings.map((r) => r.name).join(', '));
    withWarnings.forEach((r) => {
      const snippet = (r.stdout + r.stderr).match(/(.*(?:peer|unmet|WARN).*)/is);
      if (snippet) console.log(r.name + ':', snippet[1].trim().slice(0, 400));
    });
  }

  try {
    fs.rmSync(testDir, { recursive: true });
  } catch (_) {}

  process.exit(allOk ? 0 : 1);
}

main();
