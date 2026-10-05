// Test database: MONGO_URI_TEST if provided (e.g. a local MongoDB), otherwise an in-memory
// MongoDB replica set started by mongodb-memory-server (used in CI).
const mongoose = require('mongoose');

let mem = null;

async function start() {
  let uri = process.env.MONGO_URI_TEST;
  if (!uri) {
    // eslint-disable-next-line global-require
    const { MongoMemoryReplSet } = require('mongodb-memory-server');
    mem = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    uri = mem.getUri();
  }
  const dbName = `bookstore_test_${process.pid}_${Date.now()}`;
  await mongoose.connect(uri, { dbName });
  await Promise.all(Object.values(mongoose.models).map((m) => m.init().catch(() => {})));
}

async function clear() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

async function stop() {
  if (mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  if (mem) await mem.stop();
}

module.exports = { start, clear, stop };
