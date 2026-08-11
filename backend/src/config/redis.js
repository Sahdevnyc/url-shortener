const Redis = require('ioredis');

let redis = null;

function getRedis() {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err.message);
    });
  }
  return redis;
}

async function connectRedis() {
  const client = getRedis();
  try {
    await client.connect();
    console.log('Redis connected');
  } catch (err) {
    console.warn('Redis unavailable, running without cache:', err.message);
  }
}

module.exports = { getRedis, connectRedis };
