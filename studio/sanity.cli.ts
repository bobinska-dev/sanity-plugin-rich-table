import {defineCliConfig} from 'sanity/cli'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineCliConfig({
  api: {
    projectId: 'xonzamf8',
    dataset: 'production',
  },
  vite: {
    plugins: [tsconfigPaths()],
    // Dev-only fix so `sanity dev` matches `sanity build`.
    //
    // @sanity/ui (and other React-Compiler-compiled deps) import the bare
    // `react-compiler-runtime` shim. Its DEV build installs a `LazyGuardDispatcher`
    // that swaps React's *global* current dispatcher around every compiled function.
    // A rich table nests a `@portabletext/editor` (the cell editors) inside the
    // document-body `@portabletext/editor`, and that global swap corrupts the INNER
    // editor's hook state (the `useMemoCache "size 1 vs 20"` console spam). The inner
    // editor's custom block/inline components then never mount and it falls back to
    // its raw `[type: _key]` placeholders. React 19 ships a guard-free
    // `react/compiler-runtime`, so alias the shim to it. `optimizeDeps.exclude` keeps
    // Vite's dep optimizer from pre-bundling (and baking in) the shim before the alias
    // applies. `sanity build` already loads the guard-free production runtime.
    resolve: {
      alias: [{find: /^react-compiler-runtime$/, replacement: 'react/compiler-runtime'}],
    },
    optimizeDeps: {
      exclude: ['react-compiler-runtime'],
    },
  },
  deployment: {autoUpdates: true, appId: 'ht6614qoqyekhpzqpywph959'},
  reactStrictMode: true,
  reactCompiler: {target: '19'},
})
