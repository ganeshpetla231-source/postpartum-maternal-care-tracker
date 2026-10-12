import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import apiClient from '../api/apiClient';

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    apiClient
      .get('/notifications?limit=10')
      .then((response) => {
        if (active) {
          setItems(response.data.data.items);
          setUnreadCount(response.data.data.unreadCount);
        }
      })
      .catch((error) => {
        if (active) toast.error(error.response?.data?.message || 'Notifications could not be loaded.');
      });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socket = io(apiUrl.replace(/\/api\/?$/, ''), { auth: { token } });
    socket.on('notification:new', (notification) => {
      setItems((current) => [notification, ...current.filter((item) => item._id !== notification._id)].slice(0, 10));
      setUnreadCount((count) => count + 1);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Postpartum Care Tracker', { body: notification.message });
      }
    });
    return () => {
      active = false;
      socket.disconnect();
    };
  }, [token]);

  async function markRead(item) {
    if (item.isRead) return;
    try {
      await apiClient.patch(`/notifications/${item._id}/read`);
      setItems((current) =>
        current.map((notification) =>
          notification._id === item._id ? { ...notification, isRead: true } : notification
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Notification could not be marked read.');
    }
  }

  async function requestBrowserPermission() {
    if (!('Notification' in window)) {
      toast.info('Browser notifications are not supported by this browser.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') toast.success('Browser notifications enabled.');
  }

  if (!token) return null;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-1 rounded-full bg-pink-700 px-1.5 py-0.5 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            <button
              type="button"
              onClick={requestBrowserPermission}
              className="text-xs text-pink-700 hover:underline"
            >
              Enable browser alerts
            </button>
          </div>
          <ul className="mt-2 max-h-80 space-y-1 overflow-y-auto">
            {items.map((item) => (
              <li key={item._id}>
                <Link
                  to={item.link || '/reminders'}
                  onClick={() => markRead(item)}
                  className={`block rounded-lg p-2 text-sm hover:bg-slate-50 ${
                    item.isRead ? 'bg-white text-slate-600' : 'bg-white font-medium text-slate-900'
                  }`}
                >
                  {item.message}
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.createdAt))}
                  </span>
                </Link>
              </li>
            ))}
            {items.length === 0 && (
              <li className="p-3 text-sm text-slate-500">You are all caught up.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
