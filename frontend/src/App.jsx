import UrlForm from './components/UrlForm';

export default function App() {
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
        <UrlForm />
      </main>

      <footer className="footer">
        <p>Paste a long URL, optionally pick a custom alias or expiry, and get a short link instantly.</p>
      </footer>
    </div>
  );
}
