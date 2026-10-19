import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Upgrade apex domain to canonical www domain immediately to avoid 308 redirect drops on API POST/PUT requests
if (typeof window !== 'undefined' && window.location.hostname === 'dipaliwakale.in') {
  window.location.replace(`https://www.dipaliwakale.in${window.location.pathname}${window.location.search}${window.location.hash}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
