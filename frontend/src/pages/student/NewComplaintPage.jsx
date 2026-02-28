import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiFetch from '../../api/client.js';
import { supabase } from '../../supabaseClient.js';

const FALLBACK_ISSUE_TYPES = [
  'Academic',
  'Finance',
  'Facilities',
  'IT',
  'Library',
  'Student Affairs',
  'Other',
];

export default function NewComplaintPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [issueType, setIssueType] = useState('');
  const [issueTypes, setIssueTypes] = useState(FALLBACK_ISSUE_TYPES);
  const [file, setFile] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const data = await apiFetch('/api/student/departments');
        setDepartments(data);
      } catch {
        setDepartments([]);
      } finally {
        setDepartmentsLoading(false);
      }
    }

    loadDepartments();
  }, []);

  useEffect(() => {
    async function loadIssueTypes() {
      try {
        const data = await apiFetch('/api/student/issue-types');
        if (Array.isArray(data) && data.length) {
          setIssueTypes(data);
        }
      } catch {
        setIssueTypes(FALLBACK_ISSUE_TYPES);
      }
    }

    loadIssueTypes();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let fileUrl = null;

      if (file) {
        if (!supabase) {
          throw new Error('File uploads are not configured yet.');
        }

        const bucket = import.meta.env.VITE_SUPABASE_BUCKET || 'complaint-files';
        const path = `${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
        if (uploadError) {
          throw uploadError;
        }
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path);
        fileUrl = publicUrlData.publicUrl;
      }

      await apiFetch('/api/student/complaints', {
        method: 'POST',
        body: JSON.stringify({
          title,
          description,
          department_id: departmentId,
          issue_type: issueType,
          file_url: fileUrl,
        }),
      });

      setTitle('');
      setDescription('');
      setDepartmentId('');
      setIssueType('');
      setFile(null);
      setSuccess('Complaint submitted successfully.');
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
          <h1 className="page-title-luxury">New Complaint</h1>
          <p className="page-subtitle-luxury">Share issue details and route to the right department.</p>
        </div>
        <Link to="/student/chat" className="btn-luxury-secondary">
          Ask AI Helper
        </Link>
      </div>

      <section className="card-luxury page-section">
        <form onSubmit={handleSubmit} className="form-layout">
          <div className="form-group">
            <label className="form-label" htmlFor="complaint-title">
              Title
            </label>
            <input
              id="complaint-title"
              className="input-luxury"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Short summary of your issue"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="complaint-department">
              Department
            </label>
            <select
              id="complaint-department"
              className="input-luxury"
              value={departmentId}
              onChange={(event) => setDepartmentId(event.target.value)}
              disabled={departmentsLoading}
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

          <div className="form-group">
            <label className="form-label" htmlFor="complaint-issue-type">
              Issue Type
            </label>
            <select
              id="complaint-issue-type"
              className="input-luxury"
              value={issueType}
              onChange={(event) => setIssueType(event.target.value)}
              required
            >
              <option value="">Select issue type</option>
              {issueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="complaint-description">
              Description
            </label>
            <textarea
              id="complaint-description"
              rows={5}
              className="input-luxury text-area-luxury"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what happened, when, and what outcome you expect."
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="complaint-file">
              Attachment (JPG, PNG, PDF)
            </label>
            <input
              id="complaint-file"
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="file-input"
            />
          </div>

          {!departmentsLoading && departments.length === 0 && (
            <p className="alert-error">
              No departments are available. Please contact an admin.
            </p>
          )}

          {error && <p className="alert-error">{error}</p>}
          {success && <p className="alert-success">{success}</p>}

          <button
            type="submit"
            disabled={loading || departmentsLoading || departments.length === 0}
            className="btn-luxury"
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </section>
    </div>
  );
}
