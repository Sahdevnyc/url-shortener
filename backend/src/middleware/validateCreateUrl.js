const { isValidUrl, isValidAlias } = require('../utils/validateUrl');

function validateCreateUrl(req, res, next) {
  const { long_url, custom_alias, expires_at } = req.body;

  if (!long_url || !isValidUrl(long_url)) {
    return res.status(400).json({ error: 'Invalid URL. Must be http:// or https://' });
  }

  if (long_url.length > 2048) {
    return res.status(400).json({ error: 'URL exceeds maximum length of 2048 characters' });
  }

  if (custom_alias && !isValidAlias(custom_alias)) {
    return res.status(400).json({
      error: 'Invalid alias. Use 3-20 alphanumeric characters, hyphens, or underscores',
    });
  }

  if (expires_at) {
    const expiresAt = new Date(expires_at);
    if (isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      return res.status(400).json({ error: 'Expiry must be a valid future date' });
    }
    req.validatedExpiresAt = expiresAt;
  }

  next();
}

module.exports = { validateCreateUrl };
