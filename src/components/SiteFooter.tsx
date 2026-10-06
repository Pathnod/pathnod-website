export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-navigation">
      <div className="shell footer-inner">
        <div>
          <a className="footer-brand brand" href="/"><span className="brand-mark" aria-hidden="true" />pathnod</a>
          <p>Trust what is on the ground.</p>
        </div>
        <div className="footer-links">
          <a href="/operators/">For operators</a>
          <a href="/beta/">Beta waitlist</a>
          <a href="/privacy/">Privacy</a>
          <a href="/legal/">Legal notice</a>
          <a href="https://github.com/Pathnod" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href="https://x.com/pathnod" target="_blank" rel="noopener noreferrer">X ↗</a>
          <a href="https://colosseum.com/arena/projects/sovel" target="_blank" rel="noopener noreferrer">Colosseum ↗</a>
        </div>
        <span className="footer-meta">© 2026 Pathnod · Early-stage project</span>
      </div>
      </div>
    </footer>
  );
}
