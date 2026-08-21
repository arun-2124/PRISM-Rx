import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Unregister Service Workers in Development Mode to prevent Vite HMR & module interception
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then((unregistered) => {
        if (unregistered) {
          console.log('[PRISM-Rx DEV] Unregistered stale ServiceWorker to allow Vite HMR:', registration.scope);
        }
      });
    }
  });
}

// Register PWA Service Worker strictly in Production Mode
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('PRISM-Rx ServiceWorker registered in PROD:', reg.scope);
        reg.update();
      })
      .catch((err) => console.error('PRISM-Rx ServiceWorker registration failed:', err));
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
