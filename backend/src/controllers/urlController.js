const urlService = require('../services/urlService');

async function createShortUrl(req, res, next) {
  try {
    const result = await urlService.createUrl(
      req.body.long_url,
      req.body.custom_alias || null,
      req.validatedExpiresAt ?? null
    );

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

    res.status(201).json({
      short_url: `${baseUrl}/${result.short_code}`,
      short_code: result.short_code,
      long_url: result.long_url,
      expires_at: result.expires_at,
      deletion_token: result.deletion_token,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Short code already taken' });
    }
    next(err);
  }
}

async function redirectToLongUrl(req, res, next) {
  try {
    const { shortCode } = req.params;
    const url = await urlService.getUrl(shortCode);

    if (!url) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    if (url.expired) {
      return res.status(410).json({ error: 'This short URL has expired' });
    }

    const statusCode = url.expires_at ? 302 : 301;
    res.redirect(statusCode, url.long_url);
  } catch (err) {
    next(err);
  }
}

async function deleteShortUrl(req, res, next) {
  try {
    const { shortCode } = req.params;
    const { deletion_token } = req.body;

    if (!deletion_token) {
      return res.status(400).json({ error: 'Deletion token is required' });
    }

    const deleted = await urlService.deleteUrl(shortCode, deletion_token);

    if (!deleted) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { createShortUrl, redirectToLongUrl, deleteShortUrl };
