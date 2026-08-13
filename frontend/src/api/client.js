const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export async function createShortUrl({ long_url, custom_alias, expires_at }) {
  const body = { long_url };
  if (custom_alias) body.custom_alias = custom_alias;
  if (expires_at) body.expires_at = expires_at;

  const res = await fetch(`${API_BASE}/urls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to shorten URL');
  return data;
}

export async function deleteShortUrl({ short_code, deletion_token }) {
  const res = await fetch(`${API_BASE}/urls/${short_code}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deletion_token }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete URL');
  }
}
