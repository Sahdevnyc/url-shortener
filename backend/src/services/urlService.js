const pool = require('../config/database');
const { getRedis } = require('../config/redis');
const { encode } = require('../utils/base62');

const DEFAULT_CACHE_TTL_SECONDS = 300;
const CACHE_PREFIX = 'url:';

const crypto = require('crypto');

async function createUrl(longUrl, customAlias = null, expiresAt = null) {
  let result;

  const deletionToken = crypto.randomBytes(24).toString('hex');

  if (customAlias) {
    const { rows } = await pool.query(
      'INSERT INTO urls (short_code, long_url, expires_at, deletion_token) VALUES ($1, $2, $3, $4) RETURNING short_code, long_url, expires_at, deletion_token',
      [customAlias, longUrl, expiresAt, deletionToken]
    );
    result = rows[0];
  } else {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const { rows:seqRows } = await pool.query("SELECT nextval('urls_id_seq') AS id");
      const id = seqRows[0].id;
      const shortCode = encode(id);

      try {
        const { rows } = await pool.query(
          'INSERT INTO urls (id, short_code, long_url, expires_at, deletion_token) VALUES ($1, $2, $3, $4, $5) RETURNING short_code, long_url, expires_at, deletion_token',
          [id, shortCode, longUrl, expiresAt, deletionToken]
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

async function deleteUrl(shortCode, deletionToken) {
  const cacheKey = `${CACHE_PREFIX}${shortCode}`;

  try {
    const redis = getRedis();
    if (redis.status === 'ready') {
      await redis.del(cacheKey);
    }
  } catch (err) {
    console.warn('Failed to delete URL from cache before DB delete:', err.message);
  }

  const { rowCount } = await pool.query(
    'DELETE FROM urls WHERE short_code = $1 AND deletion_token = $2',
    [shortCode, deletionToken]
  );

  if (rowCount === 0) return false;

  try {
    const redis = getRedis();
    if (redis.status === 'ready') {
      await redis.del(cacheKey);
    }
  } catch (err) {
    console.warn('Failed to delete URL from cache after DB delete:', err.message);
  }

  return true;
}

async function cacheUrl({ short_code, long_url, expires_at }) {
  try {
    const redis = getRedis();
    if (redis.status !== 'ready') return;

    const value = JSON.stringify({ long_url, expires_at });
    const cacheKey = `${CACHE_PREFIX}${short_code}`;

    if (expires_at) {
      const ttl = Math.floor((new Date(expires_at) - Date.now()) / 1000);

      if (ttl > 0) {
        await redis.setex(cacheKey, Math.min(ttl, DEFAULT_CACHE_TTL_SECONDS), value);
      }

      return;
    }

    await redis.setex(cacheKey, DEFAULT_CACHE_TTL_SECONDS, value);
  } catch (err) {
    console.warn('Failed to cache URL:', err.message);
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

module.exports = { createUrl, getUrl, deleteUrl };
