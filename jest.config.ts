import {createDefaultPreset} from 'ts-jest'
import type {Config} from '@jest/types'

const tsJestTransformCfg = createDefaultPreset().transform;

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    ...tsJestTransformCfg,
    '^.+\\.tsx?$': 'ts-jest',
  },
}

export default config
