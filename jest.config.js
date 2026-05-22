/** @type {import('jest').Config} */
const config = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo/src/winter(/.*)?$': '<rootDir>/src/test/mocks/expo-winter.ts',
  },
  collectCoverageFrom: [
    'src/lib/algorithms/**/*.ts',
    'src/lib/db/queries/**/*.ts',
    'src/lib/ai/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
  ],
  coverageThreshold: {
    global: {},
    'src/lib/algorithms/': {
      statements: 90,
      branches: 85,
    },
    'src/lib/db/queries/': {
      statements: 80,
    },
    'src/lib/ai/': {
      statements: 80,
    },
  },
};

module.exports = config;
