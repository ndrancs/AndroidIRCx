module.exports = {
  preset: '@react-native/jest-preset',
  collectCoverage: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    'App.tsx',
    '!src/**/*.d.ts',
    '!src/**/*.example.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'cobertura', 'html'],
  setupFilesAfterEnv: [
    '<rootDir>/jest.rntl-compat.ts',
    '<rootDir>/jest.setup.ts',
  ],
  testEnvironment: '<rootDir>/jest.react-native-env.js',
  // Jest 30 modern fake timers default to faking queueMicrotask and
  // process.nextTick, which prevents React 19's concurrent `act` from
  // flushing effects when tests call jest.useFakeTimers(). Keep those
  // microtask APIs real so RNTL 14 renderHook/rerender effects commit.
  fakeTimers: {
    doNotFake: ['queueMicrotask', 'nextTick'],
  },
  forceExit: false,
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    // Allow ESM React Native dependencies to be transformed for Jest
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-native-firebase|react-native-tcp-socket|@noble)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', 'ZncSubscriptionScreen.test.tsx'],
};
