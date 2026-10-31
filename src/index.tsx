import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { debugError, debugLog, refreshDebugFlags } from './utils/debugLog';

refreshDebugFlags();
debugLog('react', 'renderer boot', { href: window.location.href });

window.addEventListener('error', (event) => {
  debugError('react', 'window.error', event.message, event.filename, event.lineno, event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  debugError('react', 'unhandledrejection', event.reason);
});

const bootstrap = async () => {
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('mock')) {
    await import('./devMockApi');
  }

  // App reads the Electron bridge during module evaluation, so the optional
  // browser-only development bridge must be installed before this import.
  const { default: App } = await import('./App');
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(<App />);

  debugLog('react', 'root.render called', {
    rootChildren: rootElement.childElementCount,
  });
};

void bootstrap();
