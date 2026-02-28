import { useEffect, useState } from 'react';
import apiFetch from '../../api/client.js';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadDepartments() {
    try {
      const data = await apiFetch('/api/admin/departments');
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  async function addDepartment(event) {
    event.preventDefault();
    if (!name.trim()) {
      return;
    }

    setError('');
    setSaving(true);
    try {
      await apiFetch('/api/admin/departments', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setName('');
      await loadDepartments();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">Departments</h1>
          <p className="page-subtitle-luxury">Create and monitor complaint ownership teams.</p>
        </div>
      </div>

      <section className="card-luxury page-section">
        <form onSubmit={addDepartment} className="inline-form">
          <input
            className="input-luxury"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="New department name"
          />
          <button type="submit" disabled={saving} className="btn-luxury">
            {saving ? 'Adding...' : 'Add Department'}
          </button>
        </form>
      </section>

      {error && <div className="alert-error">{error}</div>}

      <section className="card-luxury page-section">
        <div className="card-luxury-content">
          <h2 className="card-title">Department List</h2>
          <p className="card-subtitle">Complaint volume by department.</p>
        </div>

        {loading ? (
          <div className="card-luxury-content">Loading departments...</div>
        ) : (
          <ul className="department-simple-list">
            {departments.map((department) => (
              <li key={department.id} className="department-simple-item">
                <span>{department.name}</span>
                <span>{department.complaint_count} complaints</span>
              </li>
            ))}
            {departments.length === 0 && <li className="empty-inline">No departments yet.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}
