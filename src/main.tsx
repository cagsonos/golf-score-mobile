import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App.tsx'
import './index.css'

// Con registerType 'autoUpdate', la página se recarga sola cuando se activa una versión nueva.
// Además se busca versión nueva cada hora, por si la app queda abierta mucho tiempo.
const UPDATE_CHECK_MS = 60 * 60 * 1000;

registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;
    setInterval(() => {
      if (navigator.onLine) registration.update();
    }, UPDATE_CHECK_MS);
  },
});

createRoot(document.getElementById("root")!).render(<App />);
