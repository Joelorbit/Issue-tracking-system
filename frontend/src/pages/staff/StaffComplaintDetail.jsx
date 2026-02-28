import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiFetch from '../../api/client.js';

export default function StaffComplaintDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [remarkText, setRemarkText] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadComplaint() {
      try {
        const response = await apiFetch(`/api/staff/complaints/${id}`);
        setData(response);
      } catch (err) {
        setError(err.message);
      }
    }

    loadComplaint();
  }, [id]);

  async function changeStatus(nextStatus) {
    setStatusLoading(true);
    setError('');
    try {
      const updated = await apiFetch(`/api/staff/complaints/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setData((prev) => ({ ...prev, complaint: updated }));
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusLoading(false);
    }
  }

  async function addRemark(event) {
    event.preventDefault();
    if (!remarkText.trim()) {
      return;
    }

    setError('');
    try {
      const remark = await apiFetch(`/api/staff/complaints/${id}/remarks`, {
        method: 'POST',
        body: JSON.stringify({ message: remarkText }),
      });
      setData((prev) => ({ ...prev, remarks: [...(prev.remarks || []), remark] }));
      setRemarkText('');
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) {
    return (
      <section className="card-luxury page-section">
        <div className="card-luxury-content">{error || 'Loading complaint...'}</div>
      </section>
    );
  }

  const { complaint, remarks } = data;
  const canStart = complaint.status === 'Open';
  const canResolve = complaint.status === 'In Progress';

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">{complaint.title}</h1>
          <p className="page-subtitle-luxury">Review case details, update status, and add remarks.</p>
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
          <span>Student: {complaint.student_name}</span>
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

      <section className="status-actions">
        <button
          type="button"
          disabled={!canStart || statusLoading}
          onClick={() => changeStatus('In Progress')}
          className="btn-luxury-secondary"
        >
          Mark In Progress
        </button>
        <button
          type="button"
          disabled={!canResolve || statusLoading}
          onClick={() => changeStatus('Resolved')}
          className="btn-luxury"
        >
          Mark Resolved
        </button>
        <Link to="/staff/complaints" className="btn-luxury-secondary">
          Back to queue
        </Link>
      </section>

      {error && <div className="alert-error">{error}</div>}

      <section className="card-luxury page-section">
        <div className="card-luxury-content">
          <h2 className="card-title">Remarks</h2>
          <p className="card-subtitle">Student-visible updates from department staff.</p>
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

      <section className="card-luxury page-section">
        <form onSubmit={addRemark} className="form-layout">
          <div className="form-group">
            <label className="form-label" htmlFor="staff-remark">
              Add Remark
            </label>
            <textarea
              id="staff-remark"
              rows={3}
              className="input-luxury text-area-luxury"
              value={remarkText}
              onChange={(event) => setRemarkText(event.target.value)}
              placeholder="Write an update for the student."
            />
          </div>
          <button type="submit" className="btn-luxury">
            Save Remark
          </button>
        </form>
      </section>
    </div>
  );
}
