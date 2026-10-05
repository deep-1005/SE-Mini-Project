const config = require('./config/env');
const logger = require('./config/logger');
const db = require('./config/db');
const createApp = require('./app');

async function main() {
  await db.connect(config.mongoUri);
  const app = createApp();
  const server = app.listen(config.port, () => logger.info(`API listening on :${config.port}`));
  const shutdown = async () => {
    server.close();
    await db.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  logger.fatal({ err }, 'start-up failed');
  process.exit(1);
});
