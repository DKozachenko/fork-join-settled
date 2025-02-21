import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  displayName: 'Fork Join Settled',
  verbose: true,
  silent: false,
  ci: false,
  collectCoverage: false,
  coverageDirectory: undefined,
  reporters: undefined,
  rootDir: './src',
  testMatch: ['**/*.spec.ts'],
  bail: 1,
  testTimeout: 3000,
  clearMocks: true,
};

export default config;
