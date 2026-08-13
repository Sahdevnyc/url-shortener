import { useState } from 'react';
import { deleteShortUrl } from '../api/client';

function formatDate(value) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

export default function LinkList({ links, onDeleted }) {
  const [busyCode, setBusyCode] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [error, setError] = useState('');

  async function handleCopy(link) {
    try {
      await navigator.clipboard.writeText(link.short_url);
      setCopiedCode(link.short_code);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch {
      setError('Could not copy the link. Please copy it manually.');
    }
  }

  async function handleDelete(link) {
    const confirmed = window.confirm('Delete this short URL? This cannot be undone.');
    if (!confirmed) return;

    setError('');
    setBusyCode(link.short_code);

    try {
      await deleteShortUrl({
        short_code: link.short_code,
        deletion_token: link.deletion_token,
      });
      onDeleted(link.short_code);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyCode('');
    }
  }

  return (
    <section className="links-section">
      <div className="section-heading">
        <h2>My links</h2>
        <span>{links.length}</span>
      </div>

      {error && <div className="message error">{error}</div>}

      {links.length === 0 ? (
        <div className="empty-state">
          <p>No saved links yet.</p>
        </div>
      ) : (
        <div className="link-list">
          {links.map((link) => (
            <article className="link-item" key={link.short_code}>
              <div className="link-main">
                <a href={link.short_url} target="_blank" rel="noopener noreferrer" className="short-url">
                  {link.short_url}
                </a>
                <p>{link.long_url}</p>
              </div>

              <dl className="link-meta">
                <div>
                  <dt>Created</dt>
                  <dd>{formatDate(link.created_at)}</dd>
                </div>
                <div>
                  <dt>Expires</dt>
                  <dd>{formatDate(link.expires_at)}</dd>
                </div>
              </dl>

              <div className="link-actions">
                <button type="button" onClick={() => handleCopy(link)} className="copy-btn">
                  {copiedCode === link.short_code ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(link)}
                  disabled={busyCode === link.short_code}
                  className="delete-btn"
                >
                  {busyCode === link.short_code ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
