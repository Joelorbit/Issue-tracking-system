import { useEffect, useState } from 'react';
import apiFetch from '../../api/client.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_complaints: 0,
    total_open: 0,
    total_resolved: 0,
    resolution_rate: 0,
    most_common_issue_type: 'N/A',
    most_common_issue_count: 0,
    complaints_per_department: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const data = await apiFetch('/api/admin/analytics');
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <section className="card-luxury page-section">
        <div className="card-luxury-content">Loading analytics...</div>
      </section>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">Analytics Dashboard</h1>
          <p className="page-subtitle-luxury">Track complaint performance across the campus.</p>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="stats-grid">
        <article className="stat-card">
          <p className="stat-value">{stats.total_complaints}</p>
          <p className="stat-label">Total Complaints</p>
        </article>
        <article className="stat-card">
          <p className="stat-value">{stats.total_open}</p>
          <p className="stat-label">Open</p>
        </article>
        <article className="stat-card">
          <p className="stat-value">{stats.total_resolved}</p>
          <p className="stat-label">Resolved</p>
        </article>
        <article className="stat-card">
          <p className="stat-value">{stats.resolution_rate}%</p>
          <p className="stat-label">Resolution Rate</p>
        </article>
        <article className="stat-card">
          <p className="stat-value stat-value-text">{stats.most_common_issue_type}</p>
          <p className="stat-label">
            Most Common Issue ({stats.most_common_issue_count})
          </p>
        </article>
      </div>

      <section className="card-luxury page-section">
        <div className="card-luxury-content">
          <h2 className="card-title">Complaints by Department</h2>
          <p className="card-subtitle">Distribution based on current complaint count.</p>
        </div>

        {stats.complaints_per_department.length ? (
          <div className="department-list">
            {stats.complaints_per_department.map((department) => {
              const count = Number(department.count);
              const percentage =
                stats.total_complaints === 0
                  ? 0
                  : Math.round((count / stats.total_complaints) * 100);

              return (
                <article key={department.name} className="department-item">
                  <div className="department-info">
                    <div className="department-details">
                      <h3 className="department-name">{department.name}</h3>
                      <p className="department-count">{count} complaints</p>
                    </div>
                  </div>
                  <div className="department-stats">
                    <span className="department-percentage">{percentage}%</span>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3 className="empty-state-title">No data yet</h3>
            <p className="empty-state-description">
              Add departments and complaints to see analytics.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
