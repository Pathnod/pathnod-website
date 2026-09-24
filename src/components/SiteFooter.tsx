export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <a className="footer-brand" href="/">Pathnod<span className="footer-dot">.</span></a>
          <p>Independent signals for physical networks.</p>
        </div>
        <div className="footer-links">
          <a href="/operators/">For operators</a>
          <a href="/beta/">Beta waitlist</a>
          <a href="/privacy/">Privacy</a>
          <a href="/legal/">Legal notice</a>
          <a href="https://github.com/Pathnod" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
        </div>
        <span className="footer-meta">© 2026 Pathnod · Early-stage project</span>
      </div>
    </footer>
  );
}
