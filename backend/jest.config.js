module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['services/**/*.js', 'lib/**/*.js'],
  setupFilesAfterEnv: [],
};
