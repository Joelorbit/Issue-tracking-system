import { useEffect, useState } from 'react';
import apiFetch from '../../api/client.js';

function generateTempPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function CreateStaffPage() {
  const [departments, setDepartments] = useState([]);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: generateTempPassword(),
    department_id: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const data = await apiFetch('/api/admin/departments');
        setDepartments(data);
      } catch {
        setDepartments([]);
      }
    }
    loadDepartments();
  }, []);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setCreatedCredentials(null);
    setLoading(true);

    try {
      const credentials = {
        email: form.email,
        password: form.password,
      };

      await apiFetch('/api/admin/staff', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setCreatedCredentials(credentials);
      setForm({
        name: '',
        email: '',
        password: generateTempPassword(),
        department_id: '',
      });
      setSuccess('Staff account created.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animate-fade-in-up">
      <div className="page-header-luxury">
        <div>
          <h1 className="page-title-luxury">Create Staff Account</h1>
          <p className="page-subtitle-luxury">Add department staff with role-based access.</p>
        </div>
      </div>

      <section className="card-luxury page-section">
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-group">
            <label className="form-label" htmlFor="staff-name">
              Name
            </label>
            <input
              id="staff-name"
              className="input-luxury"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="staff-email">
              Email
            </label>
            <input
              id="staff-email"
              type="email"
              className="input-luxury"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="staff-password">
              Password
            </label>
            <input
              id="staff-password"
              type="password"
              className="input-luxury"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="btn-luxury-secondary"
              onClick={() => updateField('password', generateTempPassword())}
            >
              Generate Temporary Password
            </button>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="staff-department">
              Department
            </label>
            <select
              id="staff-department"
              className="input-luxury"
              value={form.department_id}
              onChange={(event) => updateField('department_id', event.target.value)}
              required
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="alert-error">{error}</p>}
          {success && <p className="alert-success">{success}</p>}
          {createdCredentials && (
            <div className="alert-success">
              Login details | Email: {createdCredentials.email} | Password:{' '}
              {createdCredentials.password}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-luxury">
            {loading ? 'Creating...' : 'Create Staff'}
          </button>
        </form>
      </section>
    </div>
  );
}
