const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');


// Create an in-memory NoSQL database for the integration testing suites
// Avoid using the actual server and database
let mongo;

module.exports.connect = async () => {
    mongo = await MongoMemoryServer.create();

    const uri = mongo.getUri();

    await mongoose.connect(uri);
};

// Extra safety (for good reason!) to avoid touching prod
function assertSafeClear() {
    const { host } = mongoose.connection;
    if (!/^(127\.0\.0\.1|localhost|::1)$/.test(host)) {
        throw new Error(`Error: Can't clear database at "${host}" as this isn't the in-memory test server.`);
    }
}

module.exports.clear = async () => {
    assertSafeClear();
    const { collections } = mongoose.connection;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};

module.exports.close = async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongo.stop();
};

