import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiFetch from '../../api/client.js';

export default function StudentComplaintDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComplaint() {
      try {
        const response = await apiFetch(`/api/student/complaints/${id}`);
        setData(response);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadComplaint();
  }, [id]);

  if (loading) {
    return (
      <section className="card-luxury page-section">
        <div className="card-luxury-content">Loading complaint details...</div>
      </section>
    );
  }

  if (error || !data?.complaint) {
    return (
      <section className="card-luxury page-section">
        <div className="card-luxury-content">
          <p className="alert-error">{error || 'Complaint not found.'}</p>
          <Link to="/dashboard" className="btn-luxury-secondary">
            Back to dashboard
          </Link>
        </div>
      </section>
    );
  }

  const { complaint, remarks } = data;

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">{complaint.title}</h1>
          <p className="page-subtitle-luxury">Complaint details and staff updates</p>
        </div>
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

      <section className="complaint-card">
        <p className="complaint-description">{complaint.description}</p>
        <div className="complaint-meta">
          <span>{complaint.department_name || 'Unassigned'}</span>
          <span className="meta-divider">|</span>
          <span>{complaint.issue_type || 'Other'}</span>
          <span className="meta-divider">|</span>
          <span>{new Date(complaint.created_at).toLocaleString()}</span>
        </div>
        {complaint.file_url && (
          <a href={complaint.file_url} target="_blank" rel="noreferrer" className="attachment-link">
            View attachment
          </a>
        )}
      </section>

      <section className="card-luxury page-section">
        <div className="card-luxury-content">
          <h2 className="card-title">Staff Remarks</h2>
          <p className="card-subtitle">Chronological updates from your department.</p>
        </div>
        <div className="remarks-list">
          {remarks?.length ? (
            remarks.map((remark) => (
              <article key={remark.id} className="remark-card">
                <h3 className="remark-author">{remark.staff_name || 'Staff'}</h3>
                <p className="remark-message">{remark.message}</p>
                <p className="remark-time">{new Date(remark.created_at).toLocaleString()}</p>
              </article>
            ))
          ) : (
            <p className="empty-inline">No remarks yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
