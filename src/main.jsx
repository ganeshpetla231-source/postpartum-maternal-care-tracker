import React from 'react';
import ReactDOM from 'react-dom/client';
import PropTypes from 'prop-types';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import App from './app/App';
import { LocaleProvider } from './i18n/LocaleContext';
import './styles.css';
import 'react-toastify/dist/ReactToastify.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-xl p-8">
          <h1 className="text-2xl font-bold text-slate-900">The application encountered a problem</h1>
          <p className="mt-3 text-slate-600">Please reload the page and try again.</p>
          <button
            type="button"
            className="mt-5 rounded-lg bg-pink-700 px-4 py-2 font-semibold text-white"
            onClick={() => window.location.reload()}
          >
            Reload application
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

AppErrorBoundary.propTypes = {
  children: PropTypes.node
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <AppErrorBoundary>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LocaleProvider>
        <App />
        <ToastContainer position="top-right" autoClose={4000} />
      </LocaleProvider>
    </BrowserRouter>
  </AppErrorBoundary>
);
