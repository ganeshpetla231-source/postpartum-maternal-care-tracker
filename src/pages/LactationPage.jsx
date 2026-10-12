import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

function localDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function LactationPage() {
  const [consultants, setConsultants] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState(localDate(1));
  const [slots, setSlots] = useState([]);
  const [mode, setMode] = useState('video');
  const [reason, setReason] = useState('');
  const [language, setLanguage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadBookings = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) return;
    const response = await apiClient.get('/lactation/bookings');
    setBookings(response.data.data);
  }, []);

  useEffect(() => {
    let active = true;
    const params = language ? `?language=${encodeURIComponent(language)}` : '';
    Promise.all([
      apiClient.get(`/lactation/consultants${params}`),
      localStorage.getItem('accessToken') ? apiClient.get('/lactation/bookings') : Promise.resolve(null)
    ])
      .then(([consultantsResponse, bookingsResponse]) => {
        if (!active) return;
        setConsultants(consultantsResponse.data.data);
        if (bookingsResponse) setBookings(bookingsResponse.data.data);
      })
      .catch((error) => toast.error(error.response?.data?.message || 'Consultants could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [language]);

  useEffect(() => {
    if (!selected) {
      setSlots([]);
      return undefined;
    }
    let active = true;
    apiClient
      .get(`/lactation/consultants/${selected._id}/slots?date=${date}`)
      .then((response) => active && setSlots(response.data.data.slots))
      .catch((error) => active && toast.error(error.response?.data?.message || 'Available slots could not be loaded.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [date, selected]);

  async function book(slotStart) {
    setSaving(true);
    try {
      await apiClient.post('/lactation/bookings', {
        consultantId: selected._id,
        slotStart,
        mode,
        reason
      });
      await Promise.all([loadBookings(), refreshSlots()]);
      toast.success('Consultation booked and added to your reminders.');
      setReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'That slot could not be booked.');
      await refreshSlots();
    } finally {
      setSaving(false);
    }
  }

  async function refreshSlots() {
    if (!selected) return;
    const response = await apiClient.get(`/lactation/consultants/${selected._id}/slots?date=${date}`);
    setSlots(response.data.data.slots);
  }

  async function cancel(bookingId) {
    try {
      await apiClient.patch(`/lactation/bookings/${bookingId}/cancel`);
      await loadBookings();
      toast.success('Booking cancelled.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking could not be cancelled.');
    }
  }

  if (loading && consultants.length === 0) return <p role="status" className="text-slate-600">Loading consultants…</p>;

  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-pink-700">Lactation care</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Book a consultation</h1>
        <p className="mt-2 text-slate-600">Choose a consultant and an available one-hour appointment.</p>
      </header>
      <label className="mt-5 block max-w-sm text-sm font-medium text-slate-700">
        Filter by language
        <input
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          placeholder="e.g. English"
          className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </label>
      {consultants.length === 0 ? (
        <p className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No consultants are available for this filter.</p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {consultants.map((consultant) => (
            <article key={consultant._id} className={`rounded-xl border p-5 ${selected?._id === consultant._id ? 'border-pink-500 bg-pink-50' : 'border-slate-200'}`}>
              <h2 className="text-lg font-semibold text-slate-900">{consultant.name}</h2>
              <p className="mt-1 text-sm text-slate-600">{consultant.qualification}</p>
              <p className="mt-2 text-sm text-slate-600">{consultant.bio}</p>
              <p className="mt-2 text-xs text-slate-500">
                {consultant.languages?.join(', ')} · {consultant.timezone}
                {consultant.fee != null && ` · Fee ${consultant.fee}`}
              </p>
              <button
                type="button"
                onClick={() => setSelected(consultant)}
                className="mt-4 rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white"
              >
                Choose consultant
              </button>
            </article>
          ))}
        </div>
      )}

      {selected && (
        <section className="mt-7 rounded-xl border border-slate-200 p-5">
          <h2 className="text-xl font-semibold text-slate-900">Available times with {selected.name}</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="text-sm font-medium text-slate-700">
              Date
              <input
                type="date"
                min={localDate(0)}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="mt-1 block rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Appointment mode
              <select value={mode} onChange={(event) => setMode(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2">
                <option value="video">Video</option>
                <option value="in-person">In person</option>
              </select>
            </label>
            <label className="min-w-56 flex-1 text-sm font-medium text-slate-700">
              What would you like help with? (optional)
              <input maxLength={1000} value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
          </div>
          {slots.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.slotStart}
                  type="button"
                  disabled={saving}
                  onClick={() => book(slot.slotStart)}
                  className="rounded-lg border border-pink-300 px-4 py-2 text-sm font-medium text-pink-800 hover:bg-pink-50 disabled:opacity-50"
                >
                  {slot.localTime} ({selected.timezone})
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No available times for this date.</p>
          )}
        </section>
      )}

      {bookings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-slate-900">My bookings</h2>
          <ul className="mt-3 space-y-3">
            {bookings.map((booking) => (
              <li key={booking._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4">
                <div>
                  <p className="font-semibold text-slate-900">{booking.consultant?.name || 'Lactation consultant'}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(booking.slotStart))}
                    {' · '}{booking.mode} · {booking.status}
                  </p>
                </div>
                {booking.status === 'booked' && (
                  <button type="button" onClick={() => cancel(booking._id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm text-rose-800">
                    Cancel booking
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default LactationPage;
