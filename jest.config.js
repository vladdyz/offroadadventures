// Setup (config then setup the test environment)
module.exports = {
    testEnvironment: 'node',
    setupFiles: ['dotenv/config'],
    setupFilesAfterEnv: ['./tests/index.js'],
};