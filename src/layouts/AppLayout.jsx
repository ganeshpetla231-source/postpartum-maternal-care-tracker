import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import NotificationBell from '../components/NotificationBell';
import { getAccessTokenPayload } from '../utils/auth';
import { useLocale } from '../i18n/LocaleContext';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'Screening', path: '/#screening', roles: ['mother'] },
  { label: 'Notebook', path: '/dashboard', roles: ['mother'] },
  { label: 'Recovery', path: '/recovery', roles: ['mother'] },
  { label: 'Baby logs', path: '/babies', roles: ['mother'] },
  { label: 'Care team', path: '/escalations', roles: ['mother', 'doctor'] },
  { label: 'Family', path: '/family', roles: ['mother', 'family'] },
  { label: 'Reminders', path: '/reminders', roles: ['mother'] },
  { label: 'Community', path: '/forum', roles: ['mother', 'family', 'doctor', 'admin'] },
  { label: 'Admin', path: '/admin', roles: ['admin'] },
  { label: 'Lactation', path: '/lactation', roles: ['mother'] },
  { label: 'Account', path: '/account' }
];

const sideItems = [
  { label: 'Contents', path: '/dashboard', roles: ['mother'] },
  { label: 'Care Plan', path: '/recovery', roles: ['mother'] },
  { label: 'Baby Logs', path: '/babies', roles: ['mother'] },
  { label: 'Wellbeing check-in', path: '/#screening', roles: ['mother'] },
  { label: 'Care team', path: '/escalations', roles: ['mother', 'doctor'] },
  { label: 'Family sharing', path: '/family', roles: ['mother', 'family'] },
  { label: 'Community', path: '/forum', roles: ['mother', 'family', 'doctor', 'admin'] },
  { label: 'Admin tools', path: '/admin', roles: ['admin'] }
];

function AppLayout({ children }) {
  const { language, setLanguage, t } = useLocale();
  const [, setAuthVersion] = useState(0);

  useEffect(() => {
    document.documentElement.dataset.theme = 'light';
    window.localStorage.removeItem('care-tracker-theme');
  }, []);

  useEffect(() => {
    const updateAuth = () => setAuthVersion((version) => version + 1);
    window.addEventListener('auth:changed', updateAuth);
    window.addEventListener('auth:expired', updateAuth);
    return () => {
      window.removeEventListener('auth:changed', updateAuth);
      window.removeEventListener('auth:expired', updateAuth);
    };
  }, []);
  const role = getAccessTokenPayload()?.role;
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || (role && item.roles.includes(role))
  );
  const visibleSideItems = sideItems.filter((item) => role && item.roles.includes(role));

  return (
    <div className="app-shell vfx-shell min-h-screen text-slate-800">
      <header className="app-header sticky top-0 z-30 border-b border-white/70">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <NavLink to="/" className="flex shrink-0 items-center gap-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400">
            <img className="app-brand-image" src="/maternity-logo.jpg" alt="" />
            <span>
              <span className="app-brand-name block text-base font-bold leading-tight tracking-tight text-slate-900 sm:text-lg">
                {t('Postpartum & Maternal Care Tracker')}
              </span>
              <span className="app-brand-tagline mt-0.5 block text-[0.68rem] font-medium uppercase tracking-[0.2em] text-rose-800">
                {t('Care at your pace')}
              </span>
            </span>
          </NavLink>
          <nav aria-label="Main navigation" className="app-top-nav flex gap-1.5 overflow-x-auto pb-1 lg:justify-end lg:pb-0">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'app-nav-link app-nav-link--active' : 'app-nav-link'
                  }`
                }
              >
                {t(item.label)}
              </NavLink>
            ))}
            <label className="sr-only" htmlFor="app-language">{t('Choose language')}</label>
            <select
              id="app-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="ml-1 self-start rounded-full border border-rose-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 lg:self-center"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिन्दी</option>
            </select>
            {role && <NotificationBell />}
          </nav>
        </div>
      </header>

      <div className="app-content-row mx-auto flex max-w-[90rem] gap-6 px-4 py-6 sm:px-6 lg:gap-8 lg:py-9">
        {visibleSideItems.length > 0 && (
          <aside className="app-sidebar hidden w-60 shrink-0 self-start rounded-3xl p-4 md:block lg:sticky lg:top-28">
            <div className="mb-4 px-3 pt-2">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-rose-800">{t('Your space')}</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{t('My notebook')}</h2>
            </div>
            <nav aria-label="Care navigation" className="space-y-1">
              {visibleSideItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `app-side-link flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition ${
                      isActive
                        ? 'bg-rose-100 text-rose-950 shadow-sm'
                        : 'text-slate-600 hover:bg-rose-50 hover:text-rose-900'
                    }`
                  }
                >
                  <span aria-hidden="true" className="app-side-dot" />
                  {t(item.label)}
                </NavLink>
              ))}
            </nav>
            <div className="mt-6 rounded-2xl bg-[#f8eee7] p-4">
              <p className="text-sm font-semibold text-[#654b48]">{t('A little reminder')}</p>
              <p className="mt-1 text-xs leading-relaxed text-[#765d59]">
                {t('Your wellbeing matters, too. Take this one day at a time.')}
              </p>
            </div>
          </aside>
        )}

        <main className="app-main min-w-0 flex-1 rounded-[1.75rem] p-5 sm:p-7 lg:p-9">{children}</main>
      </div>
      <footer className="mx-auto max-w-[90rem] px-6 pb-6 text-center text-xs text-slate-500">
        {t('Gentle support for your postpartum journey · Your care, your pace')}
      </footer>
    </div>
  );
}

AppLayout.propTypes = {
  children: PropTypes.node.isRequired
};

export default AppLayout;
