import {defineCliConfig} from 'sanity/cli'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineCliConfig({
  api: {
    projectId: 'xonzamf8',
    dataset: 'production',
  },
  vite: {
    plugins: [tsconfigPaths()],
  },
  deployment: {autoUpdates: true, appId: 'ht6614qoqyekhpzqpywph959'},
  reactStrictMode: true,
  reactCompiler: {target: '19'},
})
