import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

const categories = ['physical', 'emotional', 'wound', 'mobility', 'nutrition'];
const statuses = ['pending', 'in-progress', 'done'];

function RecoveryPage() {
  const [milestones, setMilestones] = useState([]);
  const [form, setForm] = useState({ title: '', category: 'physical', targetDate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadMilestones = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/recovery/milestones');
      setMilestones(response.data.data.items);
    } catch {
      setError('Could not load your recovery plan. Please sign in and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMilestones();
  }, [loadMilestones]);

  async function addMilestone(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/recovery/milestones', {
        ...form,
        ...(form.targetDate ? { targetDate: new Date(`${form.targetDate}T12:00:00`).toISOString() } : {})
      });
      setForm({ title: '', category: 'physical', targetDate: '' });
      await loadMilestones();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not add the recovery milestone.');
    } finally {
      setSaving(false);
    }
  }

  async function updateMilestone(milestone, changes) {
    setError('');
    try {
      const response = await apiClient.patch(`/recovery/milestones/${milestone._id}`, changes);
      setMilestones((current) =>
        current.map((item) => (item._id === milestone._id ? response.data.data : item))
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not update the recovery milestone.');
    }
  }

  async function removeMilestone(id) {
    setError('');
    try {
      await apiClient.delete(`/recovery/milestones/${id}`);
      setMilestones((current) => current.filter((item) => item._id !== id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not remove the recovery milestone.');
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">Recovery tracking</h1>
        <p className="mt-2 text-slate-600">
          Keep track of small steps in your recovery. Progress can look different for everyone.
        </p>
      </header>

      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-red-800" role="alert">
          {error}{' '}
          <Link className="underline" to="/account">
            Open account
          </Link>
        </p>
      )}

      <form className="grid gap-4 rounded-xl border border-slate-200 p-4 sm:grid-cols-2" onSubmit={addMilestone}>
        <h2 className="text-lg font-semibold sm:col-span-2">Add a recovery milestone</h2>
        <label className="grid gap-1 text-sm font-medium">
          Milestone
          <input
            className="rounded border border-slate-300 p-2"
            maxLength={160}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
            value={form.title}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Category
          <select
            className="rounded border border-slate-300 p-2"
            onChange={(event) => setForm({ ...form, category: event.target.value })}
            value={form.category}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category[0].toUpperCase() + category.slice(1)}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Target date (optional)
          <input
            className="rounded border border-slate-300 p-2"
            onChange={(event) => setForm({ ...form, targetDate: event.target.value })}
            type="date"
            value={form.targetDate}
          />
        </label>
        <button
          className="self-end rounded bg-pink-700 px-4 py-2 font-semibold text-white disabled:opacity-60"
          disabled={saving}
          type="submit"
        >
          {saving ? 'Saving...' : 'Add milestone'}
        </button>
      </form>

      <section aria-labelledby="milestone-heading">
        <h2 className="mb-3 text-xl font-semibold" id="milestone-heading">
          Your recovery plan
        </h2>
        {loading ? (
          <p role="status">Loading recovery milestones...</p>
        ) : milestones.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-slate-600">
            No milestones yet. Add one above when you are ready.
          </p>
        ) : (
          <ul className="space-y-3">
            {milestones.map((milestone) => (
              <li className="rounded-xl border border-slate-200 p-4" key={milestone._id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{milestone.title}</h3>
                    <p className="text-sm capitalize text-slate-600">
                      {milestone.category}
                      {milestone.targetDate
                        ? ` · Target ${new Date(milestone.targetDate).toLocaleDateString()}`
                        : ''}
                    </p>
                  </div>
                  <button
                    className="text-sm text-red-700 underline"
                    onClick={() => removeMilestone(milestone._id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1 text-sm font-medium">
                    Status
                    <select
                      className="rounded border border-slate-300 p-2"
                      onChange={(event) => updateMilestone(milestone, { status: event.target.value })}
                      value={milestone.status}
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('-', ' ')}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-medium">
                    Pain level: {milestone.painLevel ?? 'not set'} / 10
                    <input
                      max="10"
                      min="0"
                      onChange={(event) =>
                        updateMilestone(milestone, { painLevel: Number(event.target.value) })
                      }
                      type="range"
                      value={milestone.painLevel ?? 0}
                    />
                  </label>
                </div>
                {milestone.completedAt && (
                  <p className="mt-2 text-sm text-green-800">
                    Completed {new Date(milestone.completedAt).toLocaleDateString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

export default RecoveryPage;
