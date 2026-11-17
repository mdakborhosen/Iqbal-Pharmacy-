import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-md text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-900">পেজটি লোড করতে সাময়িক সমস্যা হয়েছে</h2>
            <p className="text-xs text-slate-600">{this.state.message}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              পেজ রিলোড করুন
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
