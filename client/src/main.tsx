import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '@/app/store';
import App from './App';
import './index.css';

// Dev-only: expose the store for debugging in the browser console.
if (import.meta.env.DEV) {
  (window as unknown as { store: typeof store }).store = store;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>
);
