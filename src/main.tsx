import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import { langFromPath } from './i18n';
import './styles.css';
import './alive.css';

const container = document.getElementById('root')!;
const app = (
  <StrictMode>
    <App lang={langFromPath(location.pathname)} />
  </StrictMode>
);

// Built pages are prerendered and hydrate; the dev server starts from an empty root.
if (container.firstElementChild) hydrateRoot(container, app);
else createRoot(container).render(app);
