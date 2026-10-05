// NFR-02: polled every five minutes by the uptime monitor.
const router = require('express').Router();
const db = require('../config/db');
const cache = require('../adapters/cache');

router.get('/health', (req, res) => {
  const dbUp = db.isUp();
  res.status(dbUp ? 200 : 503).json({
    status: dbUp ? 'ok' : 'degraded',
    db: dbUp ? 'up' : 'down',
    cache: cache.status(),
    uptime: Math.round(process.uptime()),
  });
});

module.exports = router;
