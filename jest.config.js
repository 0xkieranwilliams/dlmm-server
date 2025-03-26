module.exports = {
  testEnvironment: 'node',
  collectCoverage: false,
  collectCoverageFrom: [
    'services/**/*.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    // Exclude backup/archived test files
    '/tests/*.bak',
    '/tests/*.bak2'
  ],
  verbose: true
};