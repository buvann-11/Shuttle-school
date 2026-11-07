import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createHashRouter, RouterProvider } from 'react-router';
import '@fontsource/barlow/latin-400.css';
import '@fontsource/barlow/latin-500.css';
import '@fontsource/barlow/latin-600.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './styles/tokens.css';
import './styles/global.css';
import { routes } from './app/routes';
import { watchInstallPrompt } from './lib/pwa';
import { registerServiceWorker } from './lib/register-sw';

// Hash routing works on any static host (GitHub Pages included) with no rewrite rules.
const router = createHashRouter(routes);

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

registerServiceWorker();
watchInstallPrompt();
