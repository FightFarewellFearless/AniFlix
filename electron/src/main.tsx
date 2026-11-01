import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import App from './App';
import { registerIconFonts } from './shims/iconFonts';
import './desktop.css';

// Shared application modules (subtitle decoding, film download links, etc.)
// use Node's Buffer, but the renderer is a browser bundle where it does not
// exist by default.
(globalThis as any).Buffer = (globalThis as any).Buffer ?? Buffer;

// The icon fonts are plain .ttf files on the web, they have to be registered
// with the browser before the first icon is rendered.
registerIconFonts();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
