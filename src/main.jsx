import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import App from './app/App';
import { LocaleProvider } from './i18n/LocaleContext';
import './styles.css';
import 'react-toastify/dist/ReactToastify.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <App />
        <ToastContainer position="top-right" autoClose={4000} />
      </LocaleProvider>
    </BrowserRouter>
  </React.StrictMode>
);
