import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import { crisisResources } from '../config/crisisResources';
import { getAccessTokenPayload } from '../utils/auth';
import { useLocale } from '../i18n/LocaleContext';

const resultCopy = {
  low: {
    title: 'Thank you for checking in',
    message: 'Your answers suggest fewer signs of distress right now. Your feelings still matter, and support is here whenever you need it.'
  },
  moderate: {
    title: 'You deserve support',
    message: 'Your answers suggest you may be having a difficult time. Consider sharing how you feel with someone you trust or your care team.'
  },
  high: {
    title: 'Please reach out for support',
    message: 'Your answers suggest extra support could be helpful. If you can, contact your healthcare professional soon and let someone you trust know how you are feeling.'
  },
  critical: {
    title: 'Please connect with support now',
    message: 'Your answers suggest you should speak with a healthcare professional as soon as possible. You do not have to manage this alone.'
  }
};

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date));
}

function CrisisPanel({ emergencyContact }) {
  const { t } = useLocale();
  return (
    <section
      aria-labelledby="crisis-resources-title"
      className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5"
    >
      <h3 id="crisis-resources-title" className="text-lg font-semibold text-rose-900">
        {t('You can get help right now')}
      </h3>
      <p className="mt-1 text-sm text-rose-800">
        If you feel in immediate danger or may hurt yourself, call emergency services or go to the
        nearest emergency department. If possible, stay with someone you trust.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {crisisResources.map((resource) => (
          <a
            key={resource.phone}
            href={`tel:${resource.phone}`}
            className="rounded-lg bg-white px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100"
          >
            Call {resource.name}: {resource.phone}
            <span className="block text-xs font-normal">{resource.description}</span>
          </a>
        ))}
        {emergencyContact?.phone && (
          <a
            href={`tel:${emergencyContact.phone}`}
            className="rounded-lg bg-rose-700 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-800"
          >
            Call {emergencyContact.name || 'your emergency contact'}
          </a>
        )}
      </div>
    </section>
  );
}

CrisisPanel.propTypes = {
  emergencyContact: PropTypes.shape({
    name: PropTypes.string,
    phone: PropTypes.string
  })
};

function HistoryChart({ screenings }) {
  const { t, language } = useLocale();
  if (!screenings.length) return null;

  return (
    <section aria-labelledby="screening-history-title" className="mt-8">
      <h2 id="screening-history-title" className="text-xl font-semibold text-slate-900">
        {t('Your screening history')}
      </h2>
      <p className="mt-1 text-sm text-slate-600">{t('Scores are shown over time, from 0 to 30.')}</p>
      <div className="mt-4 space-y-3">
        {screenings.map((screening) => (
          <div key={screening._id} className="grid grid-cols-[7rem_1fr_3rem] items-center gap-3">
            <span className="text-xs text-slate-600">{new Intl.DateTimeFormat(language === 'en' ? undefined : language, { dateStyle: 'medium' }).format(new Date(screening.createdAt))}</span>
            <div
              className="h-3 overflow-hidden rounded-full bg-slate-100"
              role="img"
              aria-label={`Score ${screening.totalScore} out of 30`}
            >
              <div
                className="h-full rounded-full bg-pink-500"
                style={{ width: `${Math.max((screening.totalScore / 30) * 100, 2)}%` }}
              />
            </div>
            <span className="text-right text-sm font-medium text-slate-700">
              {screening.totalScore}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

HistoryChart.propTypes = {
  screenings: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      totalScore: PropTypes.number.isRequired
    })
  ).isRequired
};

function ScreeningPage() {
  const { t, language } = useLocale();
  const [questionnaire, setQuestionnaire] = useState(null);
  const [screenings, setScreenings] = useState([]);
  const [step, setStep] = useState(0);
  const [pageDirection, setPageDirection] = useState('forward');
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);

  const activeQuestion = questionnaire?.questions[step];
  const progress = useMemo(
    () => (questionnaire ? ((step + 1) / questionnaire.questions.length) * 100 : 0),
    [questionnaire, step]
  );

  useEffect(() => {
    let mounted = true;

    async function loadScreeningData() {
      try {
        const activeResponse = await apiClient.get('/ppd/questionnaires/active');
        if (mounted) setQuestionnaire(activeResponse.data.data);
      } catch (error) {
        if (mounted) {
          toast.error(error.response?.data?.message || 'The questionnaire could not be loaded.');
        }
      }

      if (getAccessTokenPayload()?.role === 'mother') {
        try {
          const [historyResponse, statusResponse] = await Promise.all([
            apiClient.get('/ppd/screenings'),
            apiClient.get('/ppd/risk-status')
          ]);
          if (mounted) {
            setScreenings(historyResponse.data.data.items);
            if (statusResponse.data.data.latest) {
              setResult({
                screening: statusResponse.data.data.latest,
                emergencyContact: statusResponse.data.data.emergencyContact
              });
            }
          }
        } catch (error) {
          if (mounted && error.response?.status === 401) setAuthRequired(true);
          else if (mounted && error.response) {
            toast.error(error.response.data?.message || 'Your screening history could not be loaded.');
          }
        }
      }
      if (mounted) setLoading(false);
    }

    loadScreeningData();
    return () => {
      mounted = false;
    };
  }, []);

  async function submitAnswers() {
    setSubmitting(true);
    try {
      const response = await apiClient.post('/ppd/screenings', {
        answers: questionnaire.questions.map((question) => ({
          questionId: question.id,
          score: answers[question.id]
        }))
      });
      const data = response.data.data;
      setResult({ screening: data.screening, emergencyContact: data.emergencyContact });
      setScreenings((current) => [data.screening, ...current]);
      setAuthRequired(false);
      toast.success('Your check-in has been saved.');
    } catch (error) {
      if (error.response?.status === 401) setAuthRequired(true);
      toast.error(error.response?.data?.message || 'Your answers could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function startNewScreening() {
    setAnswers({});
    setStep(0);
    setPageDirection('forward');
    setResult(null);
  }

  function turnPage(direction) {
    setPageDirection(direction);
    setStep((current) =>
      direction === 'forward'
        ? Math.min(questionnaire.questions.length - 1, current + 1)
        : Math.max(0, current - 1)
    );
  }

  if (loading) {
    return <p role="status" className="text-slate-600">Loading your wellbeing check-in…</p>;
  }

  const latest = result?.screening;
  const level = latest?.riskLevel;
  const showCrisisResources = level === 'high' || level === 'critical' || latest?.flaggedSelfHarm;

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">
          {t('Postpartum wellbeing')}
        </p>
        <h2 className="mt-1 text-3xl font-bold text-slate-900">{t('How are you feeling?')}</h2>
        <p className="mt-2 text-slate-600">
          {t('This private check-in is a chance to pause and notice how you have been feeling over the past seven days.')}
        </p>
      </header>

      {authRequired && (
        <p role="alert" className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
          {t('Your answers are still here.')}{' '}
          <Link
            className="font-semibold underline"
            to="/account"
            state={{ from: '/#screening' }}
          >
            {t('Sign in')}
          </Link>{' '}
          {t('to save this check-in and view your private screening history.')}
        </p>
      )}

      {latest && level && (
        <section aria-labelledby="screening-result-title" className="mt-6 rounded-xl bg-pink-50 p-5">
          <p className="text-sm font-medium text-pink-800">
            Your latest check-in · {formatDate(latest.createdAt)}
          </p>
          <h2 id="screening-result-title" className="mt-1 text-2xl font-bold text-slate-900">
            {t(resultCopy[level].title)}
          </h2>
          <p className="mt-2 text-slate-700">{t(resultCopy[level].message)}</p>
          <p className="mt-3 text-sm text-slate-700">
            Score: <strong>{latest.totalScore} / 30</strong>
            {latest.flaggedSelfHarm && (
              <span className="ml-2 font-semibold text-rose-800">
                Your response needs prompt support.
              </span>
            )}
          </p>
          <p className="mt-4 border-t border-pink-200 pt-3 text-xs text-slate-600">
            This questionnaire is a screening aid, not a diagnosis. Only a qualified healthcare
            professional can assess your situation. If you are worried, please reach out to your
            care team.
          </p>
          {showCrisisResources && <CrisisPanel emergencyContact={result.emergencyContact} />}
          <button
            type="button"
            onClick={startNewScreening}
            className="mt-5 rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-800"
          >
            Start a new check-in
          </button>
        </section>
      )}

      {!latest && questionnaire && activeQuestion && (
        <section aria-label="Postpartum wellbeing questionnaire" className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-rose-800">
                {t('A gentle check-in')}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {t('One page at a time, at your own pace.')}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-rose-50 px-3 py-1 text-sm font-medium text-rose-800">
              {language === 'hi' ? 'पृष्ठ' : language === 'te' ? 'పేజీ' : 'Page'} {String(step + 1).padStart(2, '0')} {language === 'hi' ? 'में से' : language === 'te' ? 'లో' : 'of'} {String(questionnaire.questions.length).padStart(2, '0')}
            </span>
          </div>
          <div className="screening-book">
            <div className="screening-book__paper">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm font-medium text-rose-900">
                  <span aria-hidden="true" className="screening-book__seal">♥</span>
                  {t('Your private wellbeing journal')}
                </div>
                <span className="text-xs font-medium uppercase tracking-widest text-stone-500">
                  {t('Past 7 days')}
                </span>
              </div>
              <div className="mb-6">
                <div
                  className="h-1.5 overflow-hidden rounded-full bg-rose-100"
                  role="progressbar"
                  aria-label="Questionnaire pages completed"
                  aria-valuemin="0"
                  aria-valuemax={questionnaire.questions.length}
                  aria-valuenow={step + 1}
                >
                  <div
                    className="h-full rounded-full bg-rose-700 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-xs text-stone-500">
                  <span>{step === 0 ? t('Beginning') : `${Math.round(progress)}% ${language === 'hi' ? 'पूरा' : language === 'te' ? 'పూర్తి' : 'complete'}`}</span>
                  <span>{step === questionnaire.questions.length - 1 ? t('Last page') : t('Keep going gently')}</span>
                </div>
              </div>

              <div
                key={step}
                className={`screening-book__page screening-book__page--${pageDirection}`}
                aria-live="polite"
              >
                <fieldset>
                  <legend id="question-title" className="text-xl font-semibold leading-relaxed text-stone-900 sm:text-2xl">
                    <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-rose-800">
                      {language === 'hi' ? 'विचार' : language === 'te' ? 'ఆలోచన' : 'Reflection'} {String(step + 1).padStart(2, '0')}
                    </span>
                    {activeQuestion.text}
                  </legend>
                  <p className="mt-3 text-sm text-stone-600">
                    {t('Choose the answer that feels closest to your experience.')}
                  </p>
                  <div className="mt-6 space-y-3">
                    {activeQuestion.options.map((option, index) => (
                      <label
                        key={`${activeQuestion.id}-${index}`}
                        className={`screening-book__choice flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                          answers[activeQuestion.id] === option.score
                            ? 'border-rose-500 bg-rose-50'
                            : 'border-stone-200 bg-white/70 hover:border-rose-300 hover:bg-rose-50/60'
                        }`}
                      >
                        <input
                          type="radio"
                          name={activeQuestion.id}
                          value={option.score}
                          checked={answers[activeQuestion.id] === option.score}
                          onChange={() =>
                            setAnswers((current) => ({ ...current, [activeQuestion.id]: option.score }))
                          }
                          className="mt-1 accent-rose-800"
                        />
                        <span className="text-stone-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="mt-7 flex items-center justify-between border-t border-rose-100 pt-5">
                <button
                  type="button"
                  onClick={() => turnPage('backward')}
                  disabled={step === 0}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span aria-hidden="true">← </span>Previous page
                </button>
                {step < questionnaire.questions.length - 1 ? (
                  <button
                    type="button"
                    disabled={answers[activeQuestion.id] === undefined}
                    onClick={() => turnPage('forward')}
                    className="rounded-lg bg-rose-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Turn to next page <span aria-hidden="true">→</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={answers[activeQuestion.id] === undefined || submitting}
                    onClick={submitAnswers}
                    className="rounded-lg bg-rose-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-900 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {submitting ? 'Saving…' : 'Finish check-in'}
                  </button>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Your answers are private. You can go back and change an answer before finishing.
          </p>
        </section>
      )}

      {questionnaire && (
        <HistoryChart screenings={screenings} />
      )}
    </div>
  );
}

export default ScreeningPage;
