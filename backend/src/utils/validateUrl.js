const RESERVED = new Set(['api', 'admin', 'health', 'static', 'assets']);

function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidAlias(alias) {
  if (!alias || alias.length < 3 || alias.length > 20) return false;
  if (!/^[a-zA-Z0-9_-]+$/.test(alias)) return false;
  if (RESERVED.has(alias.toLowerCase())) return false;
  return true;
}

module.exports = { isValidUrl, isValidAlias };
