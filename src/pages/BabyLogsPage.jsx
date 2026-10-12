import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';

function localDateTime(date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function BabyLogsPage() {
  const [babies, setBabies] = useState([]);
  const [babyId, setBabyId] = useState('');
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState(null);
  const [babyForm, setBabyForm] = useState({ name: '', dob: '' });
  const [logForm, setLogForm] = useState({
    type: 'feed',
    method: 'breast',
    amountMl: '',
    durationMin: '',
    side: 'both',
    sleepStart: localDateTime(new Date(Date.now() - 60 * 60_000)),
    sleepEnd: localDateTime(new Date()),
    diaperKind: 'wet',
    notes: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const loadBabies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get('/babies');
      const items = response.data.data;
      setBabies(items);
      setBabyId((current) =>
        items.some((baby) => baby._id === current) ? current : items[0]?._id || ''
      );
    } catch {
      setError('Could not load baby profiles. Please sign in and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBabyData = useCallback(async () => {
    if (!babyId) {
      setLogs([]);
      setSummary(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [logsResponse, summaryResponse] = await Promise.all([
        apiClient.get(`/babies/${babyId}/logs`, { params: { page: 1, limit: 50 } }),
        apiClient.get(`/babies/${babyId}/logs/summary`, { params: { date: today } })
      ]);
      setLogs(logsResponse.data.data.items);
      setSummary(summaryResponse.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not load this baby’s daily records.');
    } finally {
      setLoading(false);
    }
  }, [babyId, today]);

  useEffect(() => {
    loadBabies();
  }, [loadBabies]);

  useEffect(() => {
    loadBabyData();
  }, [loadBabyData]);

  async function addBaby(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await apiClient.post('/babies', {
        name: babyForm.name,
        dob: new Date(`${babyForm.dob}T12:00:00`).toISOString()
      });
      setBabies((current) => [...current, response.data.data]);
      setBabyId(response.data.data._id);
      setBabyForm({ name: '', dob: '' });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not create the baby profile.');
    } finally {
      setSaving(false);
    }
  }

  async function addLog(event) {
    event.preventDefault();
    if (!babyId) return;
    const body = { type: logForm.type };
    if (logForm.type === 'feed') {
      body.feed = {
        method: logForm.method,
        ...(logForm.amountMl === '' ? {} : { amountMl: Number(logForm.amountMl) }),
        ...(logForm.durationMin === '' ? {} : { durationMin: Number(logForm.durationMin) }),
        side: logForm.side
      };
    } else if (logForm.type === 'sleep') {
      body.sleep = {
        start: new Date(logForm.sleepStart).toISOString(),
        end: new Date(logForm.sleepEnd).toISOString()
      };
    } else {
      body.diaper = { kind: logForm.diaperKind };
    }
    if (logForm.notes.trim()) body.notes = logForm.notes.trim();
    setSaving(true);
    setError('');
    try {
      await apiClient.post(`/babies/${babyId}/logs`, body);
      setLogForm((current) => ({ ...current, notes: '' }));
      await loadBabyData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not add the baby log.');
    } finally {
      setSaving(false);
    }
  }

  async function removeLog(logId) {
    setError('');
    try {
      await apiClient.delete(`/babies/${babyId}/logs/${logId}`);
      await loadBabyData();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not remove the baby log.');
    }
  }

  const navPages = [
    'Add baby profile',
    'Today’s rhythm',
    'Quick add',
    'Recent notes'
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 overflow-hidden rounded-[2rem] border border-[#ead9d1] bg-gradient-to-br from-[#f9e7e2] via-[#fffaf3] to-[#edf3eb] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-rose-800">
              <span aria-hidden="true">✦</span> Baby care notebook
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#2f3e3d] sm:text-4xl">
              Baby care logs
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-[#5e6b66] sm:text-base">
              A simple place to keep your baby’s feeding, sleep, and diaper notes.
            </p>
          </div>

          {summary && (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">Feeds</p>
                <p className="mt-1 text-2xl font-bold text-[#784f57]">{summary.feeds}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">Sleep</p>
                <p className="mt-1 text-2xl font-bold text-[#4e6b57]">{summary.totalSleepMinutes}m</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3">
                <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-500">Diapers</p>
                <p className="mt-1 text-2xl font-bold text-[#7d6f69]">{summary.diapers}</p>
              </div>
            </div>
          )}
        </div>
      </header>

      {error && (
        <p className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
          {error}{' '}
          <Link className="font-semibold underline" to="/account">
            Open account
          </Link>
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-[1.5rem] border border-[#e7d7cf] bg-[#fffdf9] p-4 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-rose-800">Notebook pages</p>
          <nav className="mt-4 space-y-2" aria-label="Baby log sections">
            {navPages.map((page) => (
              <div
                key={page}
                className="rounded-2xl border border-[#f0e3dc] bg-[#f8f1ed] px-3 py-2.5 text-sm font-medium text-[#4d544f]"
              >
                {page}
              </div>
            ))}
          </nav>
          <div className="mt-6 rounded-2xl bg-[#f3f7ef] p-4 text-sm leading-6 text-[#596761]">
            Small moments count. Record what matters most and let the rhythm guide you.
          </div>
        </aside>

        <main className="space-y-6">
          <section className="rounded-[1.75rem] border border-[#e7d9ca] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#8e6b63]">Page 01</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#34413e]">Add a baby profile</h2>
              </div>
              {babies.length > 0 && (
                <label className="grid gap-1 text-sm font-medium text-[#53615d]">
                  Baby
                  <select
                    className="rounded-xl border border-[#e1d3c7] bg-white px-3 py-2 text-sm text-[#34413e]"
                    onChange={(event) => setBabyId(event.target.value)}
                    value={babyId}
                  >
                    {babies.map((baby) => (
                      <option key={baby._id} value={baby._id}>
                        {baby.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>

            <form className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_auto]" onSubmit={addBaby}>
              <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                Baby’s name
                <input
                  className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5 text-[#1f2d2c] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  maxLength={120}
                  onChange={(event) => setBabyForm({ ...babyForm, name: event.target.value })}
                  required
                  value={babyForm.name}
                />
              </label>

              <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                Date of birth
                <input
                  className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5 text-[#1f2d2c] outline-none transition focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
                  max={today}
                  onChange={(event) => setBabyForm({ ...babyForm, dob: event.target.value })}
                  required
                  type="date"
                  value={babyForm.dob}
                />
              </label>

              <button
                className="self-end rounded-xl bg-[#8f555d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#75434b] disabled:opacity-60"
                disabled={saving}
                type="submit"
              >
                {saving ? 'Saving...' : 'Add baby'}
              </button>
            </form>
          </section>

          {babies.length > 0 && (
            <>
              <section className="rounded-[1.75rem] border border-[#e7d9ca] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#7a8f7d]">Page 02</p>
                    <h2 className="mt-1 text-2xl font-semibold text-[#34413e]">Today’s rhythm</h2>
                  </div>
                </div>

                {summary && (
                  <div className="grid gap-3 md:grid-cols-4">
                    {[
                      ['Feeds', summary.feeds],
                      ['Sleep', `${summary.totalSleepMinutes} min`],
                      ['Sleep sessions', summary.sleepSessions],
                      ['Diapers', summary.diapers]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-[#f9f2ef] p-4">
                        <p className="text-sm text-[#6d736c]">{label}</p>
                        <p className="mt-2 text-2xl font-bold text-[#3e514d]">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="rounded-[1.75rem] border border-[#e7d9ca] bg-[#fffdf8] p-5 shadow-sm sm:p-6">
                <div className="mb-4">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#7a8f7d]">Page 03</p>
                  <h2 className="mt-1 text-2xl font-semibold text-[#34413e]">Quick add</h2>
                </div>

                <form className="grid gap-4 md:grid-cols-2" onSubmit={addLog}>
                  <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                    Log type
                    <select
                      className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5 text-[#1f2d2c]"
                      onChange={(event) => setLogForm({ ...logForm, type: event.target.value })}
                      value={logForm.type}
                    >
                      <option value="feed">Feed</option>
                      <option value="sleep">Sleep</option>
                      <option value="diaper">Diaper</option>
                    </select>
                  </label>

                  {logForm.type === 'feed' && (
                    <>
                      <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                        Feeding method
                        <select
                          className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5"
                          onChange={(event) => setLogForm({ ...logForm, method: event.target.value })}
                          value={logForm.method}
                        >
                          <option value="breast">Breast</option>
                          <option value="bottle">Bottle</option>
                          <option value="formula">Formula</option>
                          <option value="other">Other</option>
                        </select>
                      </label>

                      <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                        Amount (mL, optional)
                        <input
                          className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5"
                          min="0"
                          onChange={(event) => setLogForm({ ...logForm, amountMl: event.target.value })}
                          type="number"
                          value={logForm.amountMl}
                        />
                      </label>

                      <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                        Duration (minutes)
                        <input
                          className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5"
                          min="0"
                          onChange={(event) => setLogForm({ ...logForm, durationMin: event.target.value })}
                          type="number"
                          value={logForm.durationMin}
                        />
                      </label>
                    </>
                  )}

                  {logForm.type === 'sleep' && (
                    <>
                      <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                        Sleep started
                        <input
                          className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5"
                          onChange={(event) => setLogForm({ ...logForm, sleepStart: event.target.value })}
                          required
                          type="datetime-local"
                          value={logForm.sleepStart}
                        />
                      </label>

                      <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                        Sleep ended
                        <input
                          className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5"
                          onChange={(event) => setLogForm({ ...logForm, sleepEnd: event.target.value })}
                          required
                          type="datetime-local"
                          value={logForm.sleepEnd}
                        />
                      </label>
                    </>
                  )}

                  {logForm.type === 'diaper' && (
                    <label className="grid gap-1 text-sm font-medium text-[#495a56]">
                      Diaper
                      <select
                        className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5"
                        onChange={(event) => setLogForm({ ...logForm, diaperKind: event.target.value })}
                        value={logForm.diaperKind}
                      >
                        <option value="wet">Wet</option>
                        <option value="dirty">Dirty</option>
                        <option value="both">Both</option>
                      </select>
                    </label>
                  )}

                  <label className="grid gap-1 text-sm font-medium text-[#495a56] md:col-span-2">
                    Notes (optional)
                    <textarea
                      className="rounded-xl border border-[#e7d9ca] bg-white px-3 py-2.5"
                      maxLength={1000}
                      onChange={(event) => setLogForm({ ...logForm, notes: event.target.value })}
                      rows="3"
                      value={logForm.notes}
                    />
                  </label>

                  <button
                    className="rounded-xl bg-[#8f555d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#75434b] disabled:opacity-60 md:col-span-2"
                    disabled={saving}
                    type="submit"
                  >
                    {saving ? 'Saving...' : 'Save log'}
                  </button>
                </form>
              </section>
            </>
          )}

          {loading ? (
            <p className="rounded-2xl border border-[#ebded7] bg-[#fffaf8] p-4 text-sm text-slate-600" role="status">
              Loading baby care records...
            </p>
          ) : babies.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#e7d9ca] bg-[#fffaf8] p-5 text-sm text-[#5f6b68]">
              Add a baby profile to start logging care.
            </p>
          ) : logs.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-[#e7d9ca] bg-[#fffaf8] p-5 text-sm text-[#5f6b68]">
              No logs yet for this baby.
            </p>
          ) : (
            <section className="rounded-[1.75rem] border border-[#e7d9ca] bg-[#fffdf8] p-5 shadow-sm sm:p-6" aria-labelledby="log-list-heading">
              <div className="mb-4">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#7a8f7d]">Page 04</p>
                <h2 className="mt-1 text-2xl font-semibold text-[#34413e]" id="log-list-heading">
                  Recent notes
                </h2>
              </div>

              <ul className="space-y-3">
                {logs.map((log) => (
                  <li
                    className="flex flex-col gap-3 rounded-2xl border border-[#e9ddd1] bg-[#faf7f1] p-4 sm:flex-row sm:items-center sm:justify-between"
                    key={log._id}
                  >
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-rose-800">
                        {log.type}
                      </p>
                      <p className="mt-1 text-sm text-[#5f6b68]">
                        {new Date(log.loggedAt).toLocaleString()}
                        {log.type === 'feed' ? ` · ${log.feed.method}` : ''}
                        {log.type === 'sleep'
                          ? ` · ${Math.round((new Date(log.sleep.end) - new Date(log.sleep.start)) / 60_000)} minutes`
                          : ''}
                        {log.type === 'diaper' ? ` · ${log.diaper.kind}` : ''}
                      </p>
                      {log.notes && <p className="mt-1 text-sm text-[#5f6b68]">{log.notes}</p>}
                    </div>

                    <button
                      className="self-start rounded-full border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-800 transition hover:bg-rose-50"
                      onClick={() => removeLog(log._id)}
                      type="button"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default BabyLogsPage;
