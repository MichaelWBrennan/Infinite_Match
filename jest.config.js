export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).ts',
    '**/?(*.)+(spec|test).js',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.test.{ts,js}',
    '!src/**/__tests__/**',
    '!dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.js'],
  testTimeout: 10000,
  verbose: true,
  forceExit: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
    }],
  },
  // NOTE: must be `moduleNameMapper` - jest silently ignores the misspelled
  // `moduleNameMapping`, which left every `^@/...` import unresolvable.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // TypeScript ESM imports keep their `.js` extension even though the source
    // file is `.ts`; strip it so jest can resolve to the real file.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
