module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/setupEnv.js'],
  testTimeout: 60000,
  collectCoverageFrom: ['services/**/*.js', 'middleware/**/*.js', 'utils/**/*.js'],
  coverageThreshold: { './services/': { statements: 70 } }, // NFR-06 gate
};
