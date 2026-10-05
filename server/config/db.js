const mongoose = require('mongoose');
const logger = require('./logger');

mongoose.set('strictQuery', true);

async function connect(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  logger.info('MongoDB connected');
}

async function disconnect() {
  await mongoose.disconnect();
}

function isUp() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connect, disconnect, isUp };
