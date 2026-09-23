import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './app/App';
import { pageFromPath } from './app/routes';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');

const app = <App page={pageFromPath(window.location.pathname)} />;
if (root.hasChildNodes()) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
