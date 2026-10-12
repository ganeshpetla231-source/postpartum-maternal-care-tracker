import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

const permissionFields = [
  { key: 'viewBabyLogs', label: 'View baby logs' },
  { key: 'viewRecovery', label: 'View recovery progress' },
  { key: 'viewMood', label: 'Show a general wellbeing support indicator' },
  { key: 'logBabyData', label: 'Allow adding baby logs' }
];

function readUser() {
  const token = localStorage.getItem('accessToken');
  if (!token) return { role: null };
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return { role: null };
  }
}

function formatDate(date) {
  if (!date) return 'Not set';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date));
}

function FamilySharingPage() {
  const user = useMemo(readUser, []);
  const isMother = user.role === 'mother';
  const [members, setMembers] = useState([]);
  const [selectedAccessId, setSelectedAccessId] = useState('');
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState({
    viewBabyLogs: false,
    viewRecovery: false,
    viewMood: false,
    logBabyData: false
  });
  const [busyId, setBusyId] = useState('');
  const [logType, setLogType] = useState('feed');
  const [logBabyId, setLogBabyId] = useState('');
  const [logFields, setLogFields] = useState({ method: 'breast', amountMl: '', durationMin: '', kind: 'wet', start: '', end: '' });
  const [savingLog, setSavingLog] = useState(false);

  const selectedShare = members.find((member) => member._id === selectedAccessId);
  const loadMembers = useCallback(async () => {
    const response = await apiClient.get('/family/members');
    const items = response.data.data;
    setMembers(items);
    if (!isMother && items.length) {
      setSelectedAccessId((current) =>
        items.some((item) => item._id === current) ? current : items[0]._id
      );
    }
  }, [isMother]);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!['mother', 'family'].includes(user.role)) {
        setLoading(false);
        return;
      }
      try {
        await loadMembers();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Family sharing could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [loadMembers, user.role]);

  useEffect(() => {
    if (isMother || !selectedShare?.mother?._id) {
      setDashboard(null);
      return undefined;
    }
    let active = true;
    setDashboard(null);
    apiClient
      .get(`/family/mothers/${selectedShare.mother._id}/dashboard`)
      .then((response) => {
        if (active) {
          setDashboard(response.data.data);
          setLogBabyId(response.data.data.babies?.[0]?._id || '');
        }
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'This shared dashboard is unavailable.');
      });
    return () => {
      active = false;
    };
  }, [isMother, selectedShare]);

  async function sendInvite(event) {
    event.preventDefault();
    try {
      const response = await apiClient.post('/family/invites', { email, permissions });
      setMembers((current) => [response.data.data, ...current]);
      setEmail('');
      toast.success('Invitation sent. It expires in 7 days.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'The invitation could not be sent.');
    }
  }

  async function savePermissions(member) {
    setBusyId(member._id);
    try {
      const response = await apiClient.patch(`/family/members/${member._id}/permissions`, {
        permissions: member.permissions
      });
      setMembers((current) =>
        current.map((item) => (item._id === member._id ? response.data.data : item))
      );
      toast.success('Sharing permissions updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Permissions could not be updated.');
    } finally {
      setBusyId('');
    }
  }

  async function revoke(member) {
    setBusyId(member._id);
    try {
      const response = await apiClient.delete(`/family/members/${member._id}`);
      setMembers((current) =>
        current.map((item) => (item._id === member._id ? response.data.data : item))
      );
      toast.success('Access revoked. The change takes effect immediately.');
      if (!isMother) setDashboard(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Access could not be revoked.');
    } finally {
      setBusyId('');
    }
  }

  function updateMemberPermission(memberId, key, value) {
    setMembers((current) =>
      current.map((member) =>
        member._id === memberId
          ? { ...member, permissions: { ...member.permissions, [key]: value } }
          : member
      )
    );
  }

  async function addBabyLog(event) {
    event.preventDefault();
    if (!selectedShare?.mother?._id || !logBabyId) return;
    setSavingLog(true);
    let payload = { type: logType };
    if (logType === 'feed') {
      payload.feed = {
        method: logFields.method,
        amountMl: Number(logFields.amountMl),
        durationMin: Number(logFields.durationMin)
      };
    } else if (logType === 'sleep') {
      payload.sleep = { start: logFields.start, end: logFields.end };
    } else {
      payload.diaper = { kind: logFields.kind };
    }

    try {
      await apiClient.post(
        `/family/mothers/${selectedShare.mother._id}/babies/${logBabyId}/logs`,
        payload
      );
      const response = await apiClient.get(
        `/family/mothers/${selectedShare.mother._id}/dashboard`
      );
      setDashboard(response.data.data);
      toast.success('Baby log added.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'The baby log could not be added.');
    } finally {
      setSavingLog(false);
    }
  }

  if (!['mother', 'family'].includes(user.role)) {
    return (
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Family sharing</h1>
        <p className="mt-3 text-slate-600">Sign in with a mother or family account to continue.</p>
      </section>
    );
  }
  if (loading) return <p role="status" className="text-slate-600">Loading family sharing…</p>;

  if (isMother) {
    return (
      <div className="mx-auto max-w-4xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">Your support circle</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Family & sharing</h1>
          <p className="mt-2 text-slate-600">
            Choose what each person can see. You can change or revoke access at any time.
          </p>
        </header>

        <form onSubmit={sendInvite} className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Invite someone you trust</h2>
          <label htmlFor="family-email" className="mt-3 block text-sm font-medium text-slate-700">
            Their email address
          </label>
          <input
            id="family-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          />
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-slate-700">Sharing permissions</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {permissionFields.map((field) => (
                <label key={field.key} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={permissions[field.key]}
                    onChange={(event) =>
                      setPermissions((current) => ({
                        ...current,
                        [field.key]: event.target.checked
                      }))
                    }
                    className="accent-pink-700"
                  />
                  {field.label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Sharing wellbeing never reveals questionnaire answers or scores.
            </p>
          </fieldset>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-800"
          >
            Send invitation
          </button>
        </form>

        <section aria-labelledby="members-title" className="mt-8">
          <h2 id="members-title" className="text-xl font-semibold text-slate-900">People you have invited</h2>
          {members.length === 0 ? (
            <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              No family invitations yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {members.map((member) => (
                <li key={member._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {member.familyUser?.name || member.inviteEmail}
                      </p>
                      <p className="text-sm text-slate-600">
                        {member.inviteEmail} · <span className="capitalize">{member.status}</span>
                        {member.status === 'pending' && ` · expires ${formatDate(member.expiresAt)}`}
                      </p>
                    </div>
                    {member.status !== 'revoked' && (
                      <button
                        type="button"
                        onClick={() => revoke(member)}
                        disabled={busyId === member._id}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-800 hover:bg-rose-50 disabled:opacity-50"
                      >
                        Revoke access
                      </button>
                    )}
                  </div>
                  {member.status !== 'revoked' && (
                    <>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {permissionFields.map((field) => (
                          <label key={field.key} className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={Boolean(member.permissions[field.key])}
                              onChange={(event) =>
                                updateMemberPermission(member._id, field.key, event.target.checked)
                              }
                              className="accent-pink-700"
                            />
                            {field.label}
                          </label>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => savePermissions(member)}
                        disabled={busyId === member._id}
                        className="mt-3 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                      >
                        Save permissions
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">Shared care</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Family dashboard</h1>
      </header>
      {members.length > 1 && (
        <label className="mt-5 block text-sm font-medium text-slate-700">
          Shared with you by
          <select
            className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            value={selectedAccessId}
            onChange={(event) => setSelectedAccessId(event.target.value)}
          >
            {members.map((member) => (
              <option key={member._id} value={member._id}>{member.mother?.name || 'Family share'}</option>
            ))}
          </select>
        </label>
      )}
      {members.length === 0 ? (
        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          No one has shared care information with this account.
        </p>
      ) : (
        dashboard && (
          <>
            <section className="mt-5 rounded-xl bg-pink-50 p-5">
              <p className="text-sm text-pink-800">Supporting</p>
              <h2 className="text-2xl font-semibold text-slate-900">{dashboard.mother.name}</h2>
              <p className="mt-1 text-sm text-slate-600">
                Postpartum since {formatDate(dashboard.profile?.deliveryDate)}
                {dashboard.profile?.deliveryType ? ` · ${dashboard.profile.deliveryType} delivery` : ''}
              </p>
            </section>

            {dashboard.permissions.viewBabyLogs || dashboard.permissions.logBabyData ? (
              <section className="mt-6 rounded-xl border border-slate-200 p-5">
                <h2 className="text-xl font-semibold text-slate-900">Baby care</h2>
                {dashboard.babies?.length ? (
                  <>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dashboard.babies.map((baby) => (
                        <span key={baby._id} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                          {baby.name}
                        </span>
                      ))}
                    </div>
                    {dashboard.permissions.logBabyData && (
                      <form onSubmit={addBabyLog} className="mt-4 rounded-lg bg-slate-50 p-4">
                        <h3 className="font-semibold text-slate-800">Add a baby log</h3>
                        <div className="mt-2 grid gap-2 sm:grid-cols-3">
                          <label className="text-sm text-slate-700">
                            Baby
                            <select
                              value={logBabyId}
                              onChange={(event) => setLogBabyId(event.target.value)}
                              className="mt-1 block w-full rounded border border-slate-300 p-2"
                            >
                              {dashboard.babies.map((baby) => (
                                <option key={baby._id} value={baby._id}>{baby.name}</option>
                              ))}
                            </select>
                          </label>
                          <label className="text-sm text-slate-700">
                            Log type
                            <select
                              value={logType}
                              onChange={(event) => setLogType(event.target.value)}
                              className="mt-1 block w-full rounded border border-slate-300 p-2"
                            >
                              <option value="feed">Feed</option>
                              <option value="sleep">Sleep</option>
                              <option value="diaper">Diaper</option>
                            </select>
                          </label>
                          {logType === 'feed' ? (
                            <>
                              <label className="text-sm text-slate-700">
                                Method
                                <select
                                  value={logFields.method}
                                  onChange={(event) => setLogFields((current) => ({ ...current, method: event.target.value }))}
                                  className="mt-1 block w-full rounded border border-slate-300 p-2"
                                >
                                  <option value="breast">Breast</option>
                                  <option value="bottle">Bottle</option>
                                  <option value="formula">Formula</option>
                                  <option value="other">Other</option>
                                </select>
                              </label>
                              <label className="text-sm text-slate-700">
                                Amount (ml)
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={logFields.amountMl}
                                  onChange={(event) => setLogFields((current) => ({ ...current, amountMl: event.target.value }))}
                                  className="mt-1 block w-full rounded border border-slate-300 p-2"
                                />
                              </label>
                              <label className="text-sm text-slate-700">
                                Duration (min)
                                <input
                                  type="number"
                                  min="0"
                                  required
                                  value={logFields.durationMin}
                                  onChange={(event) => setLogFields((current) => ({ ...current, durationMin: event.target.value }))}
                                  className="mt-1 block w-full rounded border border-slate-300 p-2"
                                />
                              </label>
                            </>
                          ) : logType === 'sleep' ? (
                            <>
                              <label className="text-sm text-slate-700">
                                Start
                                <input
                                  type="datetime-local"
                                  required
                                  value={logFields.start}
                                  onChange={(event) => setLogFields((current) => ({ ...current, start: event.target.value }))}
                                  className="mt-1 block w-full rounded border border-slate-300 p-2"
                                />
                              </label>
                              <label className="text-sm text-slate-700">
                                End
                                <input
                                  type="datetime-local"
                                  required
                                  value={logFields.end}
                                  onChange={(event) => setLogFields((current) => ({ ...current, end: event.target.value }))}
                                  className="mt-1 block w-full rounded border border-slate-300 p-2"
                                />
                              </label>
                            </>
                          ) : (
                            <label className="text-sm text-slate-700">
                              Diaper
                              <select
                                value={logFields.kind}
                                onChange={(event) => setLogFields((current) => ({ ...current, kind: event.target.value }))}
                                className="mt-1 block w-full rounded border border-slate-300 p-2"
                              >
                                <option value="wet">Wet</option>
                                <option value="dirty">Dirty</option>
                                <option value="both">Both</option>
                              </select>
                            </label>
                          )}
                        </div>
                        <button
                          type="submit"
                          disabled={savingLog}
                          className="mt-3 rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {savingLog ? 'Saving…' : 'Save baby log'}
                        </button>
                      </form>
                    )}
                    {dashboard.permissions.viewBabyLogs ? (
                      <ul className="mt-4 divide-y divide-slate-100">
                        {(dashboard.babyLogs || []).map((log) => (
                          <li key={log._id} className="py-3 text-sm">
                            <p className="font-medium capitalize text-slate-800">
                              {log.baby?.name || 'Baby'} · {log.type} · {formatDate(log.loggedAt)}
                            </p>
                            <p className="mt-1 text-slate-600">
                              {log.type === 'feed' && `${log.feed.method} · ${log.feed.amountMl ?? '—'} ml · ${log.feed.durationMin ?? '—'} min`}
                              {log.type === 'sleep' && `${formatDate(log.sleep.start)} – ${formatDate(log.sleep.end)}`}
                              {log.type === 'diaper' && log.diaper.kind}
                            </p>
                          </li>
                        ))}
                        {dashboard.babyLogs?.length === 0 && (
                          <li className="py-3 text-sm text-slate-500">No baby logs have been shared yet.</li>
                        )}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-slate-600">
                        Existing baby logs are private. You can add a new log if that permission is enabled.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No baby profiles are available yet.</p>
                )}
              </section>
            ) : (
              <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                Baby logs have not been shared with you.
              </p>
            )}

            {dashboard.permissions.viewRecovery ? (
              <section className="mt-6 rounded-xl border border-slate-200 p-5">
                <h2 className="text-xl font-semibold text-slate-900">Recovery progress</h2>
                <ul className="mt-3 divide-y divide-slate-100">
                  {(dashboard.recovery || []).map((milestone) => (
                    <li key={milestone._id} className="py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-800">{milestone.title}</p>
                        <span className="text-sm capitalize text-slate-600">{milestone.status.replace('-', ' ')}</span>
                      </div>
                      <p className="mt-1 text-sm capitalize text-slate-500">
                        {milestone.category}
                        {milestone.targetDate ? ` · due ${formatDate(milestone.targetDate)}` : ''}
                        {Number.isInteger(milestone.painLevel) ? ` · pain ${milestone.painLevel}/10` : ''}
                      </p>
                    </li>
                  ))}
                  {dashboard.recovery?.length === 0 && (
                    <li className="py-3 text-sm text-slate-500">No recovery progress has been shared yet.</li>
                  )}
                </ul>
              </section>
            ) : (
              <p className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                Recovery progress has not been shared with you.
              </p>
            )}

            {dashboard.permissions.viewMood && (
              <aside className="mt-6 rounded-xl bg-sky-50 p-5 text-sm text-sky-900">
                {dashboard.motherMayNeedSupport === true
                  ? 'Your family member may benefit from some extra support. Consider checking in with care and kindness.'
                  : dashboard.motherMayNeedSupport === false
                    ? 'No additional support indicator is available from the shared check-in right now.'
                    : 'A wellbeing support indicator is not available yet.'}
                <p className="mt-2 text-xs text-sky-800">
                  Private questionnaire responses and scores are never shared with family.
                </p>
              </aside>
            )}
          </>
        )
      )}
    </div>
  );
}

export default FamilySharingPage;
