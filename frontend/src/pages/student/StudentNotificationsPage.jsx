import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiFetch from '../../api/client.js';

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  async function loadNotifications() {
    try {
      const data = await apiFetch('/api/student/notifications');
      setNotifications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markAsRead(id) {
    try {
      const updated = await apiFetch(`/api/student/notifications/${id}/read`, {
        method: 'PATCH',
      });

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id ? { ...notification, ...updated } : notification,
        ),
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function markAllAsRead() {
    setMarkingAll(true);
    setError('');
    try {
      await apiFetch('/api/student/notifications/read-all', {
        method: 'PATCH',
      });
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, is_read: true })),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">Notifications</h1>
          <p className="page-subtitle-luxury">
            Updates when status changes or staff add remarks.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={markingAll || unreadCount === 0}
          className="btn-luxury-secondary"
        >
          {markingAll ? 'Marking...' : `Mark all read (${unreadCount})`}
        </button>
      </div>

      {loading && (
        <section className="card-luxury page-section">
          <div className="card-luxury-content">Loading notifications...</div>
        </section>
      )}

      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && (
        <section className="card-luxury page-section">
          <div className="notification-list">
            {notifications.length === 0 && (
              <p className="empty-inline">No notifications yet.</p>
            )}

            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
              >
                <div className="notification-content">
                  <h3 className="notification-title">{notification.title}</h3>
                  <p className="notification-message">{notification.message}</p>
                  <p className="notification-time">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>

                  {notification.complaint_id && (
                    <Link
                      to={`/student/complaints/${notification.complaint_id}`}
                      className="attachment-link"
                    >
                      Open complaint
                    </Link>
                  )}
                </div>

                {!notification.is_read && (
                  <button
                    type="button"
                    onClick={() => markAsRead(notification.id)}
                    className="btn-luxury-secondary"
                  >
                    Mark read
                  </button>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
