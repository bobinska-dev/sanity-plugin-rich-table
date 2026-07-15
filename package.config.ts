import {defineConfig} from '@sanity/pkg-utils'

export default defineConfig({
  dist: 'dist',
  tsconfig: 'tsconfig.dist.json',

  dts: 'rolldown',

  // Run the React Compiler at build time (pkg-utils bundles
  // babel-plugin-react-compiler). It memoizes components, inline JSX handlers and
  // in-body functions/values, so the plugin's runtime stable-reference
  // assumptions actually hold — e.g. handlers passed to @portabletext/editor's
  // EventListenerPlugin, which re-subscribes on `on`-prop identity change. This
  // also makes the React-Compiler lint rules the repo already enforces (via
  // eslint-plugin-react-hooks@7) match the shipped build.
  babel: {reactCompiler: true},

  // Externalize @portabletext packages to use the host's versions
  // This prevents version conflicts between the plugin and the host studio
  external: [
    '@portabletext/editor',
    '@portabletext/editor/behaviors',
    '@portabletext/editor/plugins',
    '@portabletext/editor/selectors',
    '@portabletext/editor/utils',
    '@portabletext/keyboard-shortcuts',
    '@portabletext/markdown',
    '@portabletext/plugin-emoji-picker',
    '@portabletext/plugin-markdown-shortcuts',
    '@portabletext/plugin-typeahead-picker',
    '@portabletext/toolbar',
    '@portabletext/toolkit',
    // Lazy-loaded SheetJS (optionalDependency); externalized so the heavy
    // bundle is never inlined and Excel import degrades gracefully if absent.
    '@e965/xlsx',
  ],

  // Remove this block to enable strict export validation
  extract: {
    rules: {
      'ae-incompatible-release-tags': 'off',
      'ae-internal-missing-underscore': 'off',
      'ae-missing-release-tag': 'off',
    },
  },
})
