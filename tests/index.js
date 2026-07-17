const { connect, close, clear } = require('./memoryDB');
const User = require('../models/user');

// Always first connect to the in-memory Mongo database
beforeAll(async () => {
    await connect();
    await User.init();
});

// Clear out the database after each test suite so we don't have any unexpected circumstances
beforeEach(async () => {
    await clear();
});

afterEach(async () => {
    await clear();
});

// Shut down the database at the (hopefully successful!) end of all tests 
afterAll(async () => {
    await close();
});

