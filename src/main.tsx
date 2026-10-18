import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress harmless Vite HMR WebSocket errors in dev container/iframe environments
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event?.message?.includes('WebSocket closed without opened') ||
      event?.message?.includes('WebSocket') ||
      event?.filename?.includes('@vite/client')
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event?.reason?.message?.includes('WebSocket closed without opened') ||
      event?.reason?.message?.includes('WebSocket')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
