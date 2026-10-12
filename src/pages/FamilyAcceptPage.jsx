import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';
import { saveAccessToken } from '../utils/auth';

function FamilyAcceptPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function accept(event) {
    event.preventDefault();
    if (!token) {
      toast.error('This invitation link is incomplete.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await apiClient.post(
        `/family/invites/${encodeURIComponent(token)}/accept`,
        { name, password }
      );
      saveAccessToken(response.data.data.accessToken);
      toast.success('Invitation accepted. You can now view the information shared with you.');
      navigate('/family', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'This invitation could not be accepted.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-lg">
      <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">Family invitation</p>
      <h1 className="mt-1 text-3xl font-bold text-slate-900">Join their support circle</h1>
      <p className="mt-2 text-slate-600">
        Create a family account to accept this invitation. You will only see the information the
        mother chose to share.
      </p>
      <form onSubmit={accept} className="mt-6 space-y-4 rounded-xl border border-slate-200 p-5">
        <label htmlFor="family-name" className="block text-sm font-medium text-slate-700">
          Your name
          <input
            id="family-name"
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <label htmlFor="family-password" className="block text-sm font-medium text-slate-700">
          Create a password
          <input
            id="family-password"
            type="password"
            required
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !token}
          className="rounded-lg bg-pink-700 px-4 py-2 font-semibold text-white hover:bg-pink-800 disabled:opacity-50"
        >
          {submitting ? 'Accepting…' : 'Accept invitation'}
        </button>
      </form>
    </section>
  );
}

export default FamilyAcceptPage;
