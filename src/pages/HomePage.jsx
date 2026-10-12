import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAccessTokenPayload } from '../utils/auth';
import ScreeningPage from './ScreeningPage';
import { useLocale } from '../i18n/LocaleContext';

const features = [
  {
    eyebrow: 'Your wellbeing',
    title: 'Pause & check in',
    description: 'A gentle, private reflection on how you have been feeling.',
    path: '/#screening',
    action: 'Start a check-in',
    tone: 'home-feature--rose',
    mark: 'â™¡'
  },
  {
    eyebrow: 'Your recovery',
    title: 'Care plan',
    description: 'Keep track of milestones and notice the progress you are making.',
    path: '/recovery',
    action: 'View care plan',
    tone: 'home-feature--sage',
    mark: 'âœ³'
  },
  {
    eyebrow: 'Little moments',
    title: 'Baby logs',
    description: 'Record feeds, sleep and diaper changes in one simple place.',
    path: '/babies',
    action: 'Open baby logs',
    tone: 'home-feature--lavender',
    mark: 'â˜¼'
  }
];

function HomePage() {
  const { t } = useLocale();
  const role = getAccessTokenPayload()?.role;
  const location = useLocation();

  useEffect(() => {
    if (location.hash !== '#screening') return undefined;
    const timeout = window.setTimeout(() => {
      document.getElementById('screening')?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [location.hash]);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="home-hero__eyebrow">
            <span aria-hidden="true" className="home-hero__sparkle">✦</span>
            {t('Postpartum wellbeing')}
          </p>
          <h1>
            {t('Care for your baby.')}
            <span className="home-hero__headline-accent">{t(' And care for you.')}</span>
          </h1>
          <p className="home-hero__description">
            {t('The early days are a lot to hold. Find a quiet moment to check in, keep the little details together, and reach for support when you need it.')}
          </p>
          <div className="home-hero__actions">
            <Link className="home-primary-button" to="/#screening">
              {t('Take a gentle check-in')} <span aria-hidden="true">→</span>
            </Link>
            {role ? (
              <Link className="home-secondary-button" to="/dashboard">{t('Open my notebook')}</Link>
            ) : (
              <Link className="home-secondary-button" to="/account">{t('Sign in or create account')}</Link>
            )}
          </div>
          <div className="home-hero__assurance">
            <span className="home-privacy-mark" aria-hidden="true">✓</span>
            <span>{t('Your journey is personal. Your health information stays private.')}</span>
          </div>
        </div>
        <div className="home-hero__visual">
          <div className="home-hero__visual-glow" />
          <img
            className="home-hero__image"
            src="/wellbeing-background.jpg"
            alt="A mother holding her baby"
          />
          <div className="home-hero__visual-note">
            <span className="home-hero__visual-note-mark" aria-hidden="true">♡</span>
            <span>
              <strong>{t('You matter, too.')}</strong>
              <small>{t('One day at a time')}</small>
            </span>
          </div>
        </div>
      </section>
      <section className="mt-9" aria-labelledby="home-care-heading">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-800">{t('A little support')}</p>
            <h2 id="home-care-heading" className="mt-1 text-2xl font-semibold tracking-tight text-[#34413e]">
              {t('Your care, all in one place')}
            </h2>
          </div>
          <span className="text-sm text-[#72807a]">{t('Choose what feels helpful today')}</span>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {features.map((feature) => (
            <article className={`home-feature ${feature.tone}`} key={feature.path}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-600/80">{t(feature.eyebrow)}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[#34413e]">{t(feature.title)}</h3>
                </div>
                <span className="home-feature__mark" aria-hidden="true">{feature.mark}</span>
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-[#66736d]">{t(feature.description)}</p>
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#754d53] hover:text-rose-900" to={feature.path}>
                {t(feature.action)} <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="home-kind-note mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="home-kind-note__icon" aria-hidden="true">â˜</span>
          <p className="max-w-2xl text-sm leading-6 text-[#596761]">
            {t('There is no perfect way to do postpartum. This space is here to meet you where you are, without pressure or judgment.')}
          </p>
        </div>
        <Link className="shrink-0 text-sm font-semibold text-[#754d53] underline decoration-[#d9b9b2] underline-offset-4 hover:text-rose-900" to="/privacy">
          {t('Your privacy matters')}
        </Link>
      </section>

      <section
        id="screening"
        className="mt-10 scroll-mt-28 rounded-[1.75rem] border border-[#ead9d1] bg-white/70 p-5 sm:p-7"
        aria-label="Postpartum wellbeing check-in"
      >
        <ScreeningPage />
      </section>
    </div>
  );
}

export default HomePage;

