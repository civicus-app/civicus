import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

const useHashRouter = import.meta.env.VITE_ROUTER_MODE === 'hash';
const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {useHashRouter ? (
      <HashRouter>
        <App />
      </HashRouter>
    ) : (
      <BrowserRouter basename={routerBasename}>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>
);
