// Cache adapter (ADR-03). Redis when REDIS_URL is set, otherwise an in-process TTL map.
// Any Redis failure degrades to a cache miss, never to an error (SRS 2.6).
const config = require('../config/env');
const logger = require('../config/logger');

let redis = null;
if (config.redisUrl) {
  // eslint-disable-next-line global-require
  const Redis = require('ioredis');
  redis = new Redis(config.redisUrl, { lazyConnect: false, maxRetriesPerRequest: 1, enableOfflineQueue: false });
  redis.on('error', (err) => logger.warn({ err: err.message }, 'redis unavailable; cache degraded'));
}

const memory = new Map();

async function get(key) {
  try {
    if (redis) {
      const v = await redis.get(key);
      return v ? JSON.parse(v) : null;
    }
    const hit = memory.get(key);
    if (!hit) return null;
    if (hit.expires < Date.now()) {
      memory.delete(key);
      return null;
    }
    return hit.value;
  } catch (e) {
    return null;
  }
}

async function set(key, value, ttlSec) {
  try {
    if (redis) return await redis.set(key, JSON.stringify(value), 'EX', ttlSec);
    memory.set(key, { value, expires: Date.now() + ttlSec * 1000 });
  } catch (e) {
    // degrade silently
  }
  return null;
}

async function delByPrefix(prefix) {
  try {
    if (redis) {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length) await redis.del(keys);
      return;
    }
    [...memory.keys()].filter((k) => k.startsWith(prefix)).forEach((k) => memory.delete(k));
  } catch (e) {
    // degrade silently
  }
}

function status() {
  if (!redis) return 'memory';
  return redis.status === 'ready' ? 'up' : 'degraded';
}

module.exports = { get, set, delByPrefix, status, _memory: memory };
