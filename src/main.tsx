import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, '');
const useHashRouter = import.meta.env.VITE_ROUTER_MODE === 'hash';
const Router = useHashRouter ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router basename={routerBasename}>
      <App />
    </Router>
  </React.StrictMode>
);
