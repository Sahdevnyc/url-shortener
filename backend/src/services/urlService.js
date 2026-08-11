const pool = require('../config/database');
const { getRedis } = require('../config/redis');
const { encode } = require('../utils/base62');

const CACHE_PREFIX = 'url:';

async function createUrl(longUrl, customAlias = null, expiresAt = null) {
  let result;

  if (customAlias) {
    const { rows } = await pool.query(
      'INSERT INTO urls (short_code, long_url, expires_at) VALUES ($1, $2, $3) RETURNING short_code, long_url, expires_at',
      [customAlias, longUrl, expiresAt]
    );
    result = rows[0];
  } else {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { rows:seqRows } = await pool.query("SELECT nextval('urls_id_seq') AS id");
      const id = seqRows[0].id;
      const shortCode = encode(id);

      try {
        const { rows } = await pool.query(
          'INSERT INTO urls (id, short_code, long_url, expires_at) VALUES ($1, $2, $3, $4) RETURNING short_code, long_url, expires_at',
          [id, shortCode, longUrl, expiresAt]
        );
        result = rows[0];
        break;
      } catch (err) {
        if (err.code !== '23505' || attempt === 2) throw err; // 23505 is unique_violation, retry if not last attempt
      }
    }
  }

  await cacheUrl(result);
  return result;
}

async function getUrl(shortCode) {
  const cached = await getFromCache(shortCode);
  if (cached) return cached;

  const { rows } = await pool.query(
    'SELECT short_code, long_url, expires_at FROM urls WHERE short_code = $1',
    [shortCode]
  );

  if (rows.length === 0) return null;

  const url = rows[0];
  if (url.expires_at && new Date(url.expires_at) < new Date()) {
    return { expired: true };
  }

  await cacheUrl(url);
  return url;
}

async function cacheUrl({ short_code, long_url, expires_at }) {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') return;

    const value = JSON.stringify({ long_url, expires_at });
    if (expires_at) {
      const ttl = Math.floor((new Date(expires_at) - Date.now()) / 1000);
      if (ttl > 0) {
        await redis.setex(`${CACHE_PREFIX}${short_code}`, ttl, value);
      }
    } else {
      await redis.set(`${CACHE_PREFIX}${short_code}`, value);
    }
  } catch {
    // Cache failures should not break the request
  }
}

async function getFromCache(shortCode) {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') return null;

    const cached = await redis.get(`${CACHE_PREFIX}${shortCode}`);
    if (!cached) return null;

    const { long_url, expires_at } = JSON.parse(cached);
    if (expires_at && new Date(expires_at) < new Date()) {
      return { expired: true };
    }
    return { short_code: shortCode, long_url, expires_at };
  } catch {
    return null;
  }
}

module.exports = { createUrl, getUrl };
