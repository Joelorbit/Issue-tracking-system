import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiFetch from '../../api/client.js';

export default function StudentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadComplaints() {
      try {
        const data = await apiFetch('/api/student/complaints');
        setComplaints(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadComplaints();
  }, []);

  const total = complaints.length;
  const resolved = complaints.filter((item) => item.status === 'Resolved').length;
  const inProgress = complaints.filter((item) => item.status === 'In Progress').length;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">My Complaints</h1>
          <p className="page-subtitle-luxury">Track submissions and follow department responses.</p>
        </div>
        <Link to="/student/new" className="btn-accent">
          New Complaint
        </Link>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <p className="stat-value">{total}</p>
          <p className="stat-label">Total</p>
        </article>
        <article className="stat-card">
          <p className="stat-value">{inProgress}</p>
          <p className="stat-label">In Progress</p>
        </article>
        <article className="stat-card">
          <p className="stat-value">{resolved}</p>
          <p className="stat-label">Resolved</p>
        </article>
      </div>

      {loading && (
        <section className="card-luxury page-section">
          <div className="card-luxury-content">Loading complaints...</div>
        </section>
      )}

      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && (
        <section className="complaints-list">
          {complaints.length === 0 ? (
            <div className="empty-state">
              <h3 className="empty-state-title">No complaints yet</h3>
              <p className="empty-state-description">
                Submit your first complaint and the right department will pick it up.
              </p>
              <div className="empty-actions">
                <Link to="/student/new" className="btn-luxury">
                  Create Complaint
                </Link>
                <Link to="/student/chat" className="btn-luxury-secondary">
                  Ask AI Helper
                </Link>
              </div>
            </div>
          ) : (
            complaints.map((complaint) => (
              <article key={complaint.id} className="complaint-card animate-slide-in-right">
                <div className="complaint-header">
                  <h3 className="complaint-title">{complaint.title}</h3>
                  <span
                    className={`status-pill ${
                      complaint.status === 'Resolved'
                        ? 'status-resolved'
                        : complaint.status === 'In Progress'
                        ? 'status-progress'
                        : 'status-open'
                    }`}
                  >
                    {complaint.status}
                  </span>
                </div>

                <div className="complaint-meta">
                  <span>{complaint.department_name || 'Unassigned'}</span>
                  <span className="meta-divider">|</span>
                  <span>{complaint.issue_type || 'Other'}</span>
                  <span className="meta-divider">|</span>
                  <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
                </div>

                <p className="complaint-description">{complaint.description}</p>

                {complaint.file_url && (
                  <a href={complaint.file_url} target="_blank" rel="noreferrer" className="attachment-link">
                    View attachment
                  </a>
                )}

                <div className="row-actions">
                  <Link to={`/student/complaints/${complaint.id}`} className="btn-luxury-secondary">
                    View Details
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
}
