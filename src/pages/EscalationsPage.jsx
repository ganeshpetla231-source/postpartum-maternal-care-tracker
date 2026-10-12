import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

function readSession() {
  const token = localStorage.getItem('accessToken');
  if (!token) return { token: null, role: null };
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { token, role: payload.role || null, userId: payload.sub || null };
  } catch {
    return { token: null, role: null, userId: null };
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(date)
  );
}

function PatientSummary({ summary }) {
  if (!summary?.latestScreening) {
    return <p className="mt-2 text-sm text-slate-500">No screening summary is available.</p>;
  }
  const screening = summary.latestScreening;
  return (
    <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">
      <p className="font-semibold text-slate-800">Latest wellbeing screening</p>
      <p className="mt-1 text-slate-600">
        {screening.totalScore}/30 · {screening.riskLevel} · {formatDate(screening.createdAt)}
      </p>
      {screening.flaggedSelfHarm && (
        <p className="mt-1 font-semibold text-rose-800">Prompt follow-up is indicated.</p>
      )}
      {summary.recoveryDataAvailable && summary.recentMilestones?.length > 0 && (
        <ul className="mt-2 space-y-1 text-slate-600">
          {summary.recentMilestones.map((milestone) => (
            <li key={milestone._id}>
              {milestone.title} · {milestone.status}
              {Number.isInteger(milestone.painLevel) ? ` · pain ${milestone.painLevel}/10` : ''}
            </li>
          ))}
        </ul>
      )}
      {!summary.recoveryDataAvailable && (
        <p className="mt-2 text-xs text-slate-500">Recovery summary is not available in this installation.</p>
      )}
    </div>
  );
}

PatientSummary.propTypes = {
  summary: PropTypes.shape({
    recoveryDataAvailable: PropTypes.bool,
    recentMilestones: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        status: PropTypes.string.isRequired,
        painLevel: PropTypes.number
      })
    ),
    latestScreening: PropTypes.shape({
      totalScore: PropTypes.number.isRequired,
      riskLevel: PropTypes.string.isRequired,
      createdAt: PropTypes.string.isRequired,
      flaggedSelfHarm: PropTypes.bool.isRequired
    })
  })
};

function EscalationsPage() {
  const session = useMemo(readSession, []);
  const isDoctor = session.role === 'doctor';
  const [escalations, setEscalations] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [reason, setReason] = useState('');
  const [severity, setSeverity] = useState('moderate');
  const [typing, setTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);

  const selectedEscalation = escalations.find((item) => item._id === selectedId);

  const loadEscalations = useCallback(async () => {
    const response = await apiClient.get('/escalations');
    const items = response.data.data.items;
    setEscalations(items);
    setSelectedId((current) =>
      items.some((item) => item._id === current) ? current : items[0]?._id || ''
    );
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!session.token || !['mother', 'doctor'].includes(session.role)) {
        setLoading(false);
        return;
      }
      try {
        await loadEscalations();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Your care conversations could not be loaded.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [loadEscalations, session.role, session.token]);

  useEffect(() => {
    if (!selectedId || !session.token) {
      setMessages([]);
      return undefined;
    }
    let alive = true;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socket = io(apiUrl.replace(/\/api\/?$/, ''), {
      auth: { token: session.token },
      reconnection: true
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (alive) setConnected(true);
      socket.emit('escalation:join', { escalationId: selectedId }, (result) => {
        if (!alive) return;
        if (!result?.success) {
          toast.error(result?.message || 'You cannot join this conversation.');
          return;
        }
        setMessages(result.data.history.items);
        setEscalations((current) =>
          current.map((item) => (item._id === selectedId ? { ...item, unreadCount: 0 } : item))
        );
      });
    });
    socket.on('disconnect', () => {
      if (alive) setConnected(false);
    });
    socket.on('connect_error', () => {
      if (alive) setConnected(false);
    });
    socket.on('message:new', (message) => {
      if (message.escalation === selectedId || message.escalation?._id === selectedId) {
        setMessages((current) =>
          current.some((item) => item._id === message._id) ? current : [...current, message]
        );
      }
    });
    socket.on('message:read', (payload) => {
      if (payload.escalationId === selectedId) {
        setMessages((current) =>
          current.map((message) => ({
            ...message,
            readBy: message.readBy.includes(payload.readerId)
              ? message.readBy
              : [...message.readBy, payload.readerId]
          }))
        );
      }
    });
    socket.on('typing', (payload) => {
      if (payload.escalationId === selectedId) setTyping(payload.isTyping);
    });
    socket.on('escalation:updated', (updated) => {
      setEscalations((current) => current.map((item) => (item._id === updated._id ? updated : item)));
    });

    return () => {
      alive = false;
      socketRef.current = null;
      clearTimeout(typingTimerRef.current);
      socket.disconnect();
    };
  }, [selectedId, session.token]);

  async function createConcern(event) {
    event.preventDefault();
    try {
      const response = await apiClient.post('/escalations', { reason, severity });
      setEscalations((current) => [response.data.data, ...current]);
      setSelectedId(response.data.data._id);
      setReason('');
      toast.success('Your care team has been notified.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Your concern could not be sent.');
    }
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!draft.trim() || sending || !selectedId) return;
    setSending(true);
    try {
      const response = await apiClient.post(`/chats/${selectedId}/messages`, { text: draft });
      const message = response.data.data;
      setMessages((current) =>
        current.some((item) => item._id === message._id) ? current : [...current, message]
      );
      setDraft('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Your message could not be sent.');
    } finally {
      setSending(false);
    }
  }

  function updateDraft(value) {
    setDraft(value);
    if (!selectedId || !socketRef.current?.connected) return;
    socketRef.current.emit('typing', { escalationId: selectedId, isTyping: Boolean(value.trim()) });
    clearTimeout(typingTimerRef.current);
    if (value.trim()) {
      typingTimerRef.current = setTimeout(() => {
        socketRef.current?.emit('typing', { escalationId: selectedId, isTyping: false });
      }, 1200);
    }
  }

  async function updateStatus(status) {
    try {
      const response = await apiClient.patch(`/escalations/${selectedId}/status`, { status });
      setEscalations((current) =>
        current.map((item) => (item._id === selectedId ? response.data.data : item))
      );
      toast.success('Concern status updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status could not be updated.');
    }
  }

  if (!session.token || !['mother', 'doctor'].includes(session.role)) {
    return (
      <section>
        <h1 className="text-3xl font-bold text-slate-900">Care team</h1>
        <p className="mt-3 text-slate-600">
          Sign in with a mother or doctor account to view care-team conversations.
        </p>
      </section>
    );
  }

  if (loading) return <p role="status" className="text-slate-600">Loading care conversations…</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">
          {isDoctor ? 'Clinical care' : 'Your support team'}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">
          {isDoctor ? 'Patient concerns' : 'Talk to your care team'}
        </h1>
      </header>

      {!isDoctor && (
        <form onSubmit={createConcern} className="mt-6 rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900">Share a concern</h2>
          <label htmlFor="concern" className="mt-3 block text-sm font-medium text-slate-700">
            What would you like your care team to know?
          </label>
          <textarea
            id="concern"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={1000}
            required
            rows={3}
            className="mt-1 w-full rounded-lg border border-slate-300 p-3"
            placeholder="Share only what you feel comfortable sharing."
          />
          <label htmlFor="severity" className="mt-3 block text-sm font-medium text-slate-700">
            How urgent does this feel?
          </label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <select
              id="severity"
              value={severity}
              onChange={(event) => setSeverity(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <button
              type="submit"
              className="rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-800"
            >
              Send to my care team
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            This messaging feature is not an emergency service. If you or someone else is in
            immediate danger, call your local emergency number.
          </p>
        </form>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.6fr)]">
        <section aria-labelledby="concerns-title">
          <h2 id="concerns-title" className="text-lg font-semibold text-slate-900">
            {isDoctor ? 'Assigned patients' : 'Your concerns'}
          </h2>
          {escalations.length === 0 ? (
            <p className="mt-3 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
              {isDoctor ? 'No patient concerns are assigned to you yet.' : 'No concerns yet.'}
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {escalations.map((item) => (
                <li key={item._id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item._id)}
                    aria-pressed={selectedId === item._id}
                    className={`w-full rounded-lg border p-3 text-left ${
                      selectedId === item._id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-semibold capitalize text-slate-800">
                        {item.severity} · {item.status.replace('-', ' ')}
                      </span>
                      <span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span>
                    </span>
                    <span className="mt-1 block line-clamp-2 text-sm text-slate-600">
                      {item.reason}
                    </span>
                    {item.unreadCount > 0 && (
                      <span className="mt-2 inline-flex rounded-full bg-pink-700 px-2 py-0.5 text-xs font-semibold text-white">
                        {item.unreadCount} unread
                      </span>
                    )}
                    {isDoctor && <PatientSummary summary={item.patientSummary} />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="conversation-title" className="rounded-xl border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div>
              <h2 id="conversation-title" className="font-semibold text-slate-900">
                Conversation
              </h2>
              <p className="text-xs text-slate-500">
                {!selectedEscalation
                  ? 'Choose a concern to view messages.'
                  : `${connected ? 'Live connection' : 'Connecting…'} · ${selectedEscalation.status.replace('-', ' ')}`}
              </p>
            </div>
            {isDoctor && selectedEscalation && selectedEscalation.status !== 'resolved' && (
              <select
                aria-label="Update concern status"
                value={selectedEscalation.status}
                onChange={(event) => updateStatus(event.target.value)}
                className="rounded-lg border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="open" disabled>Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in-progress">In progress</option>
                <option value="resolved">Resolved</option>
              </select>
            )}
          </div>

          {selectedEscalation && (
            <>
              <div className="max-h-[28rem] min-h-48 space-y-3 overflow-y-auto p-4" aria-live="polite">
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                  {selectedEscalation.reason}
                </div>
                {messages.map((message) => (
                  <article
                    key={message._id}
                    className={`max-w-[85%] rounded-xl p-3 text-sm ${
                      String(message.sender) === String(session.userId)
                        ? 'ml-auto bg-pink-100'
                        : message.senderRole === session.role
                          ? 'ml-auto bg-pink-100'
                          : 'bg-slate-100'
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-slate-800">{message.text}</p>
                    <p className="mt-1 text-right text-[11px] text-slate-500">
                      {formatDate(message.createdAt)}
                    </p>
                  </article>
                ))}
                {typing && <p className="text-sm italic text-slate-500">The other person is typing…</p>}
              </div>
              <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-200 p-3">
                <label className="sr-only" htmlFor="message-draft">Write a message</label>
                <input
                  id="message-draft"
                  value={draft}
                  onChange={(event) => updateDraft(event.target.value)}
                  maxLength={4000}
                  onFocus={() => undefined}
                  placeholder="Write a message…"
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-800 disabled:opacity-50"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default EscalationsPage;
