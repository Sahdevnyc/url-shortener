import { useState } from 'react';
import { createShortUrl, deleteShortUrl } from '../api/client';

const EXPIRY_OPTIONS = [
  { value: '', label: 'Never expires' },
  { value: '1h', label: '1 hour' },
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'custom', label: 'Custom date and time' },
];

function toDateTimeLocalValue(date) {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 16);
}

function getExpiryIso(expiryOption, customExpiresAt) {
  if (!expiryOption) return undefined;

  if (expiryOption === 'custom') {
    return customExpiresAt ? new Date(customExpiresAt).toISOString() : undefined;
  }

  const expiresAt = new Date();
  const amount = Number.parseInt(expiryOption, 10);
  const unit = expiryOption.at(-1);

  if (unit === 'h') {
    expiresAt.setHours(expiresAt.getHours() + amount);
  }

  if (unit === 'd') {
    expiresAt.setDate(expiresAt.getDate() + amount);
  }

  return expiresAt.toISOString();
}

export default function UrlForm() {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiryOption, setExpiryOption] = useState('');
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setCopied(false);
    setLoading(true);

    try {
      if (expiryOption === 'custom' && !customExpiresAt) {
        throw new Error('Choose a custom expiry date and time, or select Never expires.');
      }

      const data = await createShortUrl({
        long_url: longUrl,
        custom_alias: customAlias || undefined,
        expires_at: getExpiryIso(expiryOption, customExpiresAt),
      });
      setResult(data);
      setLongUrl('');
      setCustomAlias('');
      setExpiryOption('');
      setCustomExpiresAt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result.short_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the link. Please copy it manually.');
    }
  }

  async function handleDelete() {
    if (!result?.short_code || !result?.deletion_token) return;

    const confirmed = window.confirm('Delete this short URL? This cannot be undone.');
    if (!confirmed) return;

    setError('');
    setDeleting(true);

    try {
      await deleteShortUrl({
        short_code: result.short_code,
        deletion_token: result.deletion_token,
      });

      setResult(null);
      setCopied(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="form-section">
      <form onSubmit={handleSubmit} className="url-form">
        <div className="field">
          <label htmlFor="longUrl">Long URL</label>
          <input
            id="longUrl"
            type="url"
            placeholder="https://example.com/very/long/path"
            value={longUrl}
            onChange={(e) => setLongUrl(e.target.value)}
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="alias">
              Custom alias <span className="optional">(optional)</span>
            </label>
            <div className="alias-input">
              <span className="alias-prefix">sho.rt/</span>
              <input
                id="alias"
                type="text"
                placeholder="my-link"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                pattern="[a-zA-Z0-9_-]{3,20}"
                title="3-20 alphanumeric characters, hyphens, or underscores"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="expires">
              Expires <span className="optional">(optional)</span>
            </label>
            <select
              id="expires"
              value={expiryOption}
              onChange={(e) => setExpiryOption(e.target.value)}
              aria-describedby="expires-help"
            >
              {EXPIRY_OPTIONS.map((option) => (
                <option key={option.value || 'never'} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {expiryOption === 'custom' && (
              <input
                className="custom-expiry-input"
                type="datetime-local"
                value={customExpiresAt}
                onChange={(e) => setCustomExpiresAt(e.target.value)}
                min={toDateTimeLocalValue(new Date())}
                aria-label="Custom expiry date and time"
              />
            )}
            <p id="expires-help" className="field-help">
              Pick a common expiry quickly, or leave it as never expires.
            </p>
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Shortening…' : 'Shorten URL'}
          </button>
        </div>
      </form>

      {error && <div className="message error">{error}</div>}

      {result && (
        <div className="result">
          <p className="result-label">Your short URL</p>
          <div className="result-row">
            <a href={result.short_url} target="_blank" rel="noopener noreferrer" className="short-url">
              {result.short_url}
            </a>
            <button onClick={handleCopy} className="copy-btn">
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button onClick={handleDelete} disabled={deleting} className="delete-btn">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
          <p className="result-meta">
            Redirects to: <span>{result.long_url}</span>
            {result.expires_at && (
              <> · Expires {new Date(result.expires_at).toLocaleString()}</>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
