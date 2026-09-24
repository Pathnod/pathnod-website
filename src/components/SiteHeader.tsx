import { useState } from 'react';
import type { Page } from '../app/routes';

export function SiteHeader({ page }: { page: Page }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="brand" href="/" aria-label="Pathnod home">
          <span className="brand-mark" aria-hidden="true" />
          <span>Pathnod</span>
        </a>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="site-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu <span aria-hidden="true">☰</span>
        </button>
        <nav id="site-nav" className={`site-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          <a href={page === 'home' ? '#problem' : '/#problem'} onClick={closeMenu}>The problem</a>
          <a href={page === 'home' ? '#approach' : '/#approach'} onClick={closeMenu}>Our approach</a>
          <a href="/operators/" aria-current={page === 'operators' ? 'page' : undefined} onClick={closeMenu}>For operators</a>
          <a className="nav-cta" href="/beta/" aria-current={page === 'beta' ? 'page' : undefined} onClick={closeMenu}>
            Join the beta <span aria-hidden="true">↗</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
