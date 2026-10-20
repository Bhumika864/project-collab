module.exports = {
  testEnvironment: 'node',
  // This file will run before all tests to set up the in-memory database
  setupFilesAfterEnv: ['./tests/setup.js'], 
};