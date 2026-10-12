import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient, { refreshAccessToken } from '../api/apiClient';
import { clearAccessToken, homePathForRole, saveAccessToken } from '../utils/auth';
import { useLocale } from '../i18n/LocaleContext';

async function getRequestErrorMessage(error, fallback) {
  const responseData = error.response?.data;
  if (responseData instanceof Blob) {
    const responseText = await responseData.text();
    try {
      return JSON.parse(responseText).message || fallback;
    } catch {
      return fallback;
    }
  }
  return responseData?.message || fallback;
}

function AuthPage() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const location = useLocation();
  const [registering, setRegistering] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', consentAccepted: false });
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState({
    deliveryDate: '',
    deliveryType: '',
    complications: [],
    emergencyContact: { name: '', phone: '' }
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadAccount = async () => {
      try {
        if (!localStorage.getItem('accessToken')) {
          const session = await refreshAccessToken();
          saveAccessToken(session.data.data.accessToken);
        }
        const response = await apiClient.get('/auth/me');
        if (!cancelled) setCurrentUser(response.data.data);
      } catch {
        clearAccessToken();
      }
    };
    loadAccount();
    const handleExpiredSession = () => setCurrentUser(null);
    window.addEventListener('auth:expired', handleExpiredSession);
    return () => {
      cancelled = true;
      window.removeEventListener('auth:expired', handleExpiredSession);
    };
  }, []);

  useEffect(() => {
    if (currentUser?.role !== 'mother') return;
    let cancelled = false;
    setProfileLoading(true);
    apiClient
      .get('/profile')
      .then((response) => {
        if (cancelled) return;
        const data = response.data.data;
        setProfile({
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString().slice(0, 10) : '',
          deliveryType: data.deliveryType || '',
          complications: data.complications || [],
          emergencyContact: {
            name: data.emergencyContact?.name || '',
            phone: data.emergencyContact?.phone || ''
          }
        });
      })
      .catch(() => toast.error('Your care profile could not be loaded.'))
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, currentUser?.role]);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileSaving(true);
    try {
      const complications = Array.isArray(profile.complications)
        ? profile.complications
        : profile.complications.split('\n').map((item) => item.trim()).filter(Boolean);
      const response = await apiClient.put('/profile', {
        ...profile,
        deliveryDate: profile.deliveryDate || null,
        deliveryType: profile.deliveryType || null,
        complications
      });
      const data = response.data.data;
      setProfile({
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate).toISOString().slice(0, 10) : '',
        deliveryType: data.deliveryType || '',
        complications: data.complications || [],
        emergencyContact: {
          name: data.emergencyContact?.name || '',
          phone: data.emergencyContact?.phone || ''
        }
      });
      toast.success('Your care profile was saved.');
      if (location.state?.onboarding) {
        navigate('/dashboard', { replace: true, state: null });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Your care profile could not be saved.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await apiClient.post('/auth/logout');
      clearAccessToken();
      setCurrentUser(null);
      toast.success('You have been signed out.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'You could not be signed out.');
    } finally {
      setSigningOut(false);
    }
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiClient.post(
        registering ? '/auth/register' : '/auth/login',
        registering ? form : { email: form.email, password: form.password }
      );
      saveAccessToken(response.data.data.accessToken);
      setCurrentUser(response.data.data.user);
      toast.success(registering ? 'Your account is ready.' : 'Welcome back.');
      const requestedPath = location.state?.from;
      const nextPath =
        registering && response.data.data.user.role === 'mother'
          ? '/account'
          : typeof requestedPath === 'string' && requestedPath.startsWith('/')
            ? requestedPath
            : homePathForRole(response.data.data.user.role);
      navigate(
        nextPath,
        {
          replace: true,
          state: registering && response.data.data.user.role === 'mother' ? { onboarding: true } : null
        }
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Your request could not be completed.');
    } finally {
      setSubmitting(false);
    }
  }

  async function exportData() {
    try {
      const response = await apiClient.get('/auth/export');
      const blob = new Blob([JSON.stringify(response.data.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'postpartum-health-data-export.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Your data export is ready.');
    } catch (error) {
      toast.error(await getRequestErrorMessage(error, 'Your data export could not be generated.'));
    }
  }

  async function deleteAccount(event) {
    event.preventDefault();
    if (!deleteConfirmed) return;
    setDeleting(true);
    try {
      const response = await apiClient.delete('/auth/account', {
        data: { password: deletePassword },
        responseType: 'blob'
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'postpartum-health-data-export.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      clearAccessToken();
      setCurrentUser(null);
      setDeletePassword('');
      setDeleteConfirmed(false);
      setForm({ name: '', email: '', password: '', consentAccepted: false });
      toast.success('Your identity was deleted. The anonymized archive is retained for seven years.');
      navigate('/account', { replace: true });
    } catch (error) {
      toast.error(await getRequestErrorMessage(error, 'Account deletion could not be completed.'));
    } finally {
      setDeleting(false);
    }
  }

  if (currentUser) {
    return (
      <section className="mx-auto max-w-lg space-y-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">
            {location.state?.onboarding ? 'Getting started' : 'Account'}
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            {location.state?.onboarding ? 'Set up your care profile' : 'Your account'}
          </h1>
          <p className="mt-2 text-slate-700">
            {location.state?.onboarding
              ? 'Share only what feels comfortable. You can update these details any time.'
              : `Signed in as ${currentUser.name} (${currentUser.email}).`}
          </p>
        </div>
        <button
          className="rounded-lg border border-slate-400 px-4 py-2 font-semibold text-slate-800 disabled:opacity-50"
          disabled={signingOut}
          onClick={signOut}
          type="button"
        >
          {signingOut ? 'Signing out...' : 'Sign out'}
        </button>
        <button
          className="rounded-lg border border-pink-700 px-4 py-2 font-semibold text-pink-800"
          onClick={exportData}
          type="button"
        >
          Download my data
        </button>
        {currentUser.role === 'mother' && (
          <form className="space-y-4 rounded-xl border border-slate-200 p-5" onSubmit={saveProfile}>
            <h2 className="text-xl font-semibold text-slate-900">Postpartum care profile</h2>
            {profileLoading ? (
              <p className="text-sm text-slate-600">Loading your profile...</p>
            ) : (
              <>
                <label className="block text-sm font-medium text-slate-700">
                  Delivery date
                  <input
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(event) => setProfile((current) => ({ ...current, deliveryDate: event.target.value }))}
                    type="date"
                    value={profile.deliveryDate}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Delivery type
                  <select
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                    onChange={(event) => setProfile((current) => ({ ...current, deliveryType: event.target.value }))}
                    value={profile.deliveryType}
                  >
                    <option value="">Not specified</option>
                    <option value="normal">Vaginal</option>
                    <option value="c-section">C-section</option>
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Complications (one per line)
                  <textarea
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                    onChange={(event) => setProfile((current) => ({
                      ...current,
                      complications: event.target.value
                    }))}
                    rows={3}
                    value={Array.isArray(profile.complications) ? profile.complications.join('\n') : profile.complications}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Emergency contact name
                  <input
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                    maxLength={120}
                    onChange={(event) => setProfile((current) => ({
                      ...current,
                      emergencyContact: { ...current.emergencyContact, name: event.target.value }
                    }))}
                    value={profile.emergencyContact.name}
                  />
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Emergency contact phone
                  <input
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
                    maxLength={40}
                    onChange={(event) => setProfile((current) => ({
                      ...current,
                      emergencyContact: { ...current.emergencyContact, phone: event.target.value }
                    }))}
                    type="tel"
                    value={profile.emergencyContact.phone}
                  />
                </label>
                <button
                  className="rounded-lg bg-pink-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
                  disabled={profileSaving}
                  type="submit"
                >
                  {profileSaving ? 'Saving...' : location.state?.onboarding ? 'Save and continue' : 'Save care profile'}
                </button>
                {location.state?.onboarding && (
                  <button
                    className="ml-3 rounded-lg border border-slate-400 px-4 py-2 font-semibold text-slate-700"
                    onClick={() => navigate('/dashboard', { replace: true, state: null })}
                    type="button"
                  >
                    Do this later
                  </button>
                )}
              </>
            )}
          </form>
        )}
        {currentUser.role === 'mother' && (
          <form className="space-y-4 rounded-xl border border-red-200 p-5" onSubmit={deleteAccount}>
          <h2 className="text-xl font-semibold text-red-900">Delete account</h2>
          <p className="text-sm text-slate-700">
            Your identity and live account data will be deleted. A structured, de-identified
            health archive will be retained for seven years and then permanently removed.
            This action cannot be undone. The archive is downloaded for you before the account
            is deleted.
          </p>
          <label className="block text-sm font-medium text-slate-700">
            Current password
            <input
              autoComplete="current-password"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
              onChange={(event) => setDeletePassword(event.target.value)}
              required
              type="password"
              value={deletePassword}
            />
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input
              checked={deleteConfirmed}
              className="mt-1 accent-red-700"
              onChange={(event) => setDeleteConfirmed(event.target.checked)}
              required
              type="checkbox"
            />
            <span>I understand my identity and live account records will be permanently deleted.</span>
          </label>
          <button
            className="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white disabled:opacity-50"
            disabled={deleting}
            type="submit"
          >
            {deleting ? 'Deleting...' : 'Download export and delete account'}
          </button>
          </form>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-lg">
      <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">{t('Account')}</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">
        {registering ? t('Create your account') : t('Welcome back')}
      </h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-slate-200 p-5">
        {registering && (
          <label className="block text-sm font-medium text-slate-700">
            {t('Name')}
            <input
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        )}
        <label className="block text-sm font-medium text-slate-700">
          {t('Email')}
          <input
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('Password')}
          <input
            type="password"
            required
            minLength={registering ? 8 : 1}
            maxLength={128}
            autoComplete={registering ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          {registering && (
            <span className="mt-1 block text-xs font-normal text-slate-500">
              {t('Use 8 to 128 characters.')}
            </span>
          )}
        </label>
        {registering && (
          <div className="rounded-lg bg-slate-50 p-3">
            <label className="flex items-start gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                required
                checked={form.consentAccepted}
                onChange={(event) => setForm((current) => ({ ...current, consentAccepted: event.target.checked }))}
                className="mt-1 accent-pink-700"
              />
              <span>
                {t('I understand this app stores sensitive wellbeing and care information so it can provide the features I choose. Screening is not a diagnosis. I agree to the')}{' '}
                <Link to="/privacy" className="text-pink-700 underline">{t('privacy notice')}</Link>.
              </span>
            </label>
          </div>
        )}
        <button type="submit" disabled={submitting} className="rounded-lg bg-pink-700 px-4 py-2 font-semibold text-white disabled:opacity-50">
          {submitting ? 'Please wait…' : registering ? t('Create account') : t('Sign in')}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setRegistering((current) => !current)}
        className="mt-4 text-sm text-pink-700 underline"
      >
        {registering ? t('Already have an account? Sign in') : t('New here? Create a mother account')}
      </button>
    </section>
  );
}

export default AuthPage;
