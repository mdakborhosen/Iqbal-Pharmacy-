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

  // Global helper for hard-refreshing app and purging all service worker & browser storage caches
  (window as any).purgeAppCacheAndReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      localStorage.setItem('iqbal_deploy_version', `force_${Date.now()}`);
    } catch {
      // ignore
    }
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  };

  // Auto-reload immediately when a new service worker version is deployed on Cloudflare Pages
  if ('serviceWorker' in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        navigator.serviceWorker.getRegistration().then((reg) => {
          reg?.update().catch(() => {});
        }).catch(() => {});
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(<App />);
