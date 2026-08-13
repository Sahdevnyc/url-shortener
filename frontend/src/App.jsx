import { useEffect, useState } from 'react';
import UrlForm from './components/UrlForm';
import LinkList from './components/LinkList';

const STORAGE_KEY = 'shortener.links';

function readStoredLinks() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [activeView, setActiveView] = useState('create');
  const [links, setLinks] = useState(readStoredLinks);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }, [links]);

  function handleCreated(link) {
    setLinks((currentLinks) => {
      const savedLink = {
        ...link,
        created_at: new Date().toISOString(),
      };

      return [
        savedLink,
        ...currentLinks.filter((item) => item.short_code !== link.short_code),
      ];
    });
  }

  function handleDeleted(shortCode) {
    setLinks((currentLinks) => currentLinks.filter((link) => link.short_code !== shortCode));
  }

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <span className="logo-icon">🔗</span>
          <h1>sho.rt</h1>
        </div>
        <p className="tagline">Shorten your links. Share them anywhere.</p>
      </header>

      <main className="main">
        <nav className="view-tabs" aria-label="URL shortener views">
          <button
            type="button"
            className={activeView === 'create' ? 'active' : ''}
            onClick={() => setActiveView('create')}
          >
            Create
          </button>
          <button
            type="button"
            className={activeView === 'links' ? 'active' : ''}
            onClick={() => setActiveView('links')}
          >
            My links
          </button>
        </nav>

        {activeView === 'create' ? (
          <UrlForm onCreated={handleCreated} onDeleted={handleDeleted} />
        ) : (
          <LinkList links={links} onDeleted={handleDeleted} />
        )}
      </main>

      <footer className="footer">
        <p>Paste a long URL, optionally pick a custom alias or expiry, and get a short link instantly.</p>
      </footer>
    </div>
  );
}
