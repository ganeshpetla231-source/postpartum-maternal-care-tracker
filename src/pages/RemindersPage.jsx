import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

function ReminderForm({ onCreated }) {
  const [form, setForm] = useState({
    type: 'medication',
    title: '',
    dosage: '',
    scheduleType: 'daily',
    times: ['09:00'],
    daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
    scheduledAt: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    location: ''
  });
  const [saving, setSaving] = useState(false);
  const oneTime = form.scheduleType === 'once';

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      times: oneTime ? [] : form.times,
      daysOfWeek: form.scheduleType === 'weekly' ? form.daysOfWeek : [],
      scheduledAt: oneTime ? new Date(form.scheduledAt).toISOString() : undefined,
      startDate: oneTime ? new Date(form.scheduledAt).toISOString() : new Date().toISOString()
    };
    try {
      const response = await apiClient.post('/reminders', payload);
      onCreated(response.data.data);
      setForm((current) => ({ ...current, title: '', dosage: '', location: '', scheduledAt: '' }));
      toast.success('Reminder created.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reminder could not be created.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-slate-200 p-5">
      <h2 className="text-xl font-semibold text-slate-900">Add a reminder</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Type
          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value,
                scheduleType: event.target.value === 'appointment' ? 'once' : 'daily'
              }))
            }
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="medication">Medication</option>
            <option value="appointment">Appointment</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          Title
          <input
            required
            maxLength={160}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>
        {form.type === 'medication' && (
          <label className="text-sm font-medium text-slate-700">
            Dosage
            <input
              maxLength={120}
              value={form.dosage}
              onChange={(event) => setForm((current) => ({ ...current, dosage: event.target.value }))}
              placeholder="Optional"
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        )}
        <label className="text-sm font-medium text-slate-700">
          Schedule
          <select
            value={form.scheduleType}
            onChange={(event) => setForm((current) => ({ ...current, scheduleType: event.target.value }))}
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            <option value="once">One time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        {oneTime ? (
          <label className="text-sm font-medium text-slate-700">
            Date & time
            <input
              type="datetime-local"
              required
              value={form.scheduledAt}
              onChange={(event) => setForm((current) => ({ ...current, scheduledAt: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        ) : (
          <label className="text-sm font-medium text-slate-700">
            Times ({form.timezone})
            <input
              type="time"
              required
              value={form.times[0]}
              onChange={(event) => setForm((current) => ({ ...current, times: [event.target.value] }))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        )}
        {form.type === 'appointment' && (
          <label className="text-sm font-medium text-slate-700">
            Location
            <input
              maxLength={300}
              value={form.location}
              onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        )}
      </div>
      {form.scheduleType === 'weekly' && (
        <fieldset className="mt-4">
          <legend className="text-sm font-medium text-slate-700">Repeat on</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <label key={day} className="flex items-center gap-1 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.daysOfWeek.includes(index)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      daysOfWeek: event.target.checked
                        ? [...current.daysOfWeek, index]
                        : current.daysOfWeek.filter((value) => value !== index)
                    }))
                  }
                  className="accent-pink-700"
                />
                {day}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <button
        type="submit"
        disabled={saving || (form.scheduleType === 'weekly' && form.daysOfWeek.length === 0)}
        className="mt-5 rounded-lg bg-pink-700 px-4 py-2 font-semibold text-white hover:bg-pink-800 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save reminder'}
      </button>
    </form>
  );
}

function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('today');
  const token = useMemo(() => localStorage.getItem('accessToken'), []);
  const load = useCallback(async () => {
    const response = await apiClient.get('/reminders?limit=100');
    setReminders(response.data.data.items);
  }, []);

  useEffect(() => {
    let active = true;
    apiClient
      .get('/reminders?limit=100')
      .then((response) => {
        if (active) setReminders(response.data.data.items);
      })
      .catch((error) => toast.error(error.response?.data?.message || 'Reminders could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const visibleReminders = reminders.filter((reminder) => {
    if (reminder.status !== 'active') return tab === 'upcoming';
    if (tab === 'upcoming') return true;
    if (reminder.scheduleType !== 'once') return true;
    const date = new Date(reminder.scheduledAt);
    const now = new Date();
    return date.toDateString() === now.toDateString();
  });

  async function updateStatus(reminder, status) {
    try {
      const response = await apiClient.patch(`/reminders/${reminder._id}`, { status });
      setReminders((current) =>
        current.map((item) => (item._id === reminder._id ? response.data.data : item))
      );
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reminder could not be updated.');
    }
  }

  async function complete(reminder) {
    try {
      const response = await apiClient.post(`/reminders/${reminder._id}/complete`, {
        occurrenceKey: new Date().toISOString()
      });
      setReminders((current) =>
        current.map((item) => (item._id === reminder._id ? response.data.data : item))
      );
      toast.success('Completion recorded.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Completion could not be saved.');
    }
  }

  async function remove(reminder) {
    try {
      await apiClient.delete(`/reminders/${reminder._id}`);
      setReminders((current) => current.filter((item) => item._id !== reminder._id));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Reminder could not be deleted.');
    }
  }

  if (!token) {
    return <p className="text-slate-600">Sign in with a mother account to manage reminders.</p>;
  }
  if (loading) return <p role="status" className="text-slate-600">Loading reminders…</p>;

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">Care routine</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Reminders</h1>
      </header>
      <div className="mt-6">
        <ReminderForm
          onCreated={(reminder) => {
            setReminders((current) => [reminder, ...current]);
            load();
          }}
        />
      </div>
      <section className="mt-8">
        <div className="flex gap-2" role="tablist" aria-label="Reminder filters">
          {['today', 'upcoming'].map((value) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => setTab(value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                tab === value ? 'bg-pink-700 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
        {visibleReminders.length === 0 ? (
          <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            No reminders in this view.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {visibleReminders.map((reminder) => (
              <li key={reminder._id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold capitalize text-slate-900">
                      {reminder.type}: {reminder.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {reminder.dosage && `${reminder.dosage} · `}
                      {reminder.scheduleType === 'once'
                        ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(reminder.scheduledAt))
                        : `${reminder.scheduleType} at ${reminder.times.join(', ')} (${reminder.timezone})`}
                      {reminder.location && ` · ${reminder.location}`}
                    </p>
                    <p className="mt-1 text-xs capitalize text-slate-500">
                      {reminder.status}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {reminder.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => complete(reminder)}
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white"
                      >
                        Done
                      </button>
                    )}
                    {reminder.status !== 'completed' && (
                      <button
                        type="button"
                        onClick={() => updateStatus(reminder, reminder.status === 'paused' ? 'active' : 'paused')}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      >
                        {reminder.status === 'paused' ? 'Resume' : 'Pause'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(reminder)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-800"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

ReminderForm.propTypes = {
  onCreated: PropTypes.func.isRequired
};

export default RemindersPage;
