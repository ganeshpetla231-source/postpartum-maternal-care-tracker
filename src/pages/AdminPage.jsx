import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

function tokenRole() {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).role;
  } catch {
    return null;
  }
}

function AdminPage() {
  const [role] = useState(tokenRole);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [search, setSearch] = useState('');
  const [userRole, setUserRole] = useState('');
  const [status, setStatus] = useState('');
  const [doctorForm, setDoctorForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(true);

  const loadUsers = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.set('search', search);
    if (userRole) params.set('role', userRole);
    if (status) params.set('status', status);
    const response = await apiClient.get(`/admin/users?${params}`);
    setUsers(response.data.data.items);
  }, [search, userRole, status]);

  const loadReports = useCallback(async () => {
    const response = await apiClient.get('/admin/reports?limit=100');
    setReports(response.data.data.items);
  }, []);

  useEffect(() => {
    let active = true;
    if (role !== 'admin') {
      setLoading(false);
      return undefined;
    }
    Promise.all([loadUsers(), loadReports()])
      .catch((error) => toast.error(error.response?.data?.message || 'Admin data could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [loadReports, loadUsers, role]);

  if (role !== 'admin') {
    return (
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Admin</h1>
        <p className="mt-2 text-slate-600">This area is restricted to administrators.</p>
      </section>
    );
  }
  if (loading) return <p role="status" className="text-slate-600">Loading admin panel…</p>;

  async function toggleUser(user) {
    try {
      const response = await apiClient.patch(`/admin/users/${user._id}/status`, {
        isActive: !user.isActive
      });
      setUsers((current) =>
        current.map((item) => (item._id === user._id ? { ...item, ...response.data.data } : item))
      );
      toast.success('Account status updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Account status could not be updated.');
    }
  }

  async function createDoctor(event) {
    event.preventDefault();
    try {
      await apiClient.post('/admin/doctors', doctorForm);
      setDoctorForm({ name: '', email: '', password: '' });
      await loadUsers();
      toast.success('Verified doctor account created.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Doctor account could not be created.');
    }
  }

  async function moderate(item, action) {
    const reportId = item.kind === 'report' ? item.report._id : item.post.id;
    try {
      await apiClient.patch(`/admin/reports/${reportId}`, {
        action,
        kind: item.kind
      });
      setReports((current) =>
        current.filter((entry) =>
          entry.kind === 'report'
            ? entry.report._id !== reportId
            : entry.post.id !== reportId
        )
      );
      toast.success('Moderation action recorded.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Moderation action failed.');
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Restricted access</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Admin panel</h1>
        <p className="mt-2 text-sm text-slate-600">
          This panel contains account and moderation data only. Health records and screening answers
          are intentionally unavailable to administrators.
        </p>
      </header>

      <section className="mt-6 rounded-xl border border-slate-200 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Create a doctor account</h2>
        <form onSubmit={createDoctor} className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="text-sm text-slate-700">
            Name
            <input
              required
              minLength={2}
              maxLength={120}
              value={doctorForm.name}
              onChange={(event) => setDoctorForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            Email
            <input
              type="email"
              required
              value={doctorForm.email}
              onChange={(event) => setDoctorForm((current) => ({ ...current, email: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            Initial password (12+ characters)
            <input
              type="password"
              required
              minLength={12}
              maxLength={128}
              value={doctorForm.password}
              onChange={(event) => setDoctorForm((current) => ({ ...current, password: event.target.value }))}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <button type="submit" className="w-fit rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white">
            Create verified doctor
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">User accounts</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="admin-user-search">Search users</label>
          <input
            id="admin-user-search"
            placeholder="Search name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2"
          />
          <select aria-label="Filter users by role" value={userRole} onChange={(event) => setUserRole(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">All roles</option>
            {['mother', 'family', 'doctor', 'admin'].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
          <select aria-label="Filter users by status" value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-slate-300 px-3 py-2">
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user._id}>
                  <td className="p-3 font-medium">{user.name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3 capitalize">{user.role}{user.role === 'doctor' && user.isVerified ? ' · verified' : ''}</td>
                  <td className="p-3">{user.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="p-3">
                    {user.role !== 'admin' && (
                      <button type="button" onClick={() => toggleUser(user)} className="text-pink-700 underline">
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-slate-500">No matching accounts.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">Moderation queue</h2>
        {reports.length === 0 ? (
          <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No reports need review.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reports.map((item) => {
              const id = item.kind === 'report' ? item.report._id : item.post.id;
              const preview = item.kind === 'report' ? item.content?.text : `${item.post.title}\n${item.post.body}`;
              return (
                <li key={`${item.kind}-${id}`} className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    {item.kind === 'report' ? `${item.report.targetType} report · ${item.report.reason}` : `Automatic flag · ${item.post.flags.join(', ')}`}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{preview || 'Content unavailable.'}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Author: {item.kind === 'report' && item.content?.isAnonymous ? 'Anonymous (identity available only to authorized moderators)' : (item.kind === 'report' ? item.content?.author?.name : item.post.author?.name) || 'Unknown'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    {['hide', 'warn', 'dismiss'].map((action) => (
                      <button key={action} type="button" onClick={() => moderate(item, action)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm capitalize hover:bg-slate-50">
                        {action}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

export default AdminPage;
