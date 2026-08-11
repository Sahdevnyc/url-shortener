import { useState } from 'react';
import { createShortUrl } from '../api/client';

export default function UrlForm() {
  const [longUrl, setLongUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);
    setCopied(false);
    setLoading(true);

    try {
      const data = await createShortUrl({
        long_url: longUrl,
        custom_alias: customAlias || undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });
      setResult(data);
      setLongUrl('');
      setCustomAlias('');
      setExpiresAt('');
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
            <input
              id="expires"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              aria-describedby="expires-help"
            />
            <p id="expires-help" className="field-help">
              Leave blank to keep this link active. Times use your local timezone.
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
