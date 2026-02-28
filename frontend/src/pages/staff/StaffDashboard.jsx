import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiFetch from '../../api/client.js';

export default function StaffDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadComplaints() {
      try {
        const data = await apiFetch('/api/staff/complaints');
        setComplaints(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadComplaints();
  }, []);

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">Department Queue</h1>
          <p className="page-subtitle-luxury">Review and process complaints assigned to your department.</p>
        </div>
      </div>

      {loading && (
        <section className="card-luxury page-section">
          <div className="card-luxury-content">Loading department complaints...</div>
        </section>
      )}

      {error && <div className="alert-error">{error}</div>}

      {!loading && !error && (
        <section className="complaints-list">
          {complaints.length === 0 ? (
            <div className="empty-state">
              <h3 className="empty-state-title">No complaints in your queue</h3>
              <p className="empty-state-description">
                New student submissions for your department will appear here automatically.
              </p>
            </div>
          ) : (
            complaints.map((complaint) => (
              <article key={complaint.id} className="complaint-card">
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
                  <span>{complaint.student_name}</span>
                  <span className="meta-divider">|</span>
                  <span>{complaint.issue_type || 'Other'}</span>
                  <span className="meta-divider">|</span>
                  <span>{new Date(complaint.created_at).toLocaleString()}</span>
                </div>

                <p className="complaint-description">{complaint.description}</p>

                <div className="row-actions">
                  <Link to={`/staff/complaints/${complaint.id}`} className="btn-luxury-secondary">
                    Open Detail
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
