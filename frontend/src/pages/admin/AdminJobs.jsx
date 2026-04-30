import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';

const EMPTY = { title:'',companyName:'',description:'',location:'',jobType:'Full-time',salaryPackage:'',eligibleBranches:'',eligibleBatches:'',minimumCgpa:'',skills:'',applicationDeadline:'',totalPositions:'',status:'ACTIVE' };
const DEPT_ABBR = {
  'Computer Science & Engineering': 'CSE',
  'Electronics & Communication': 'ECE',
  'Mechanical Engineering': 'ME',
  'Civil Engineering': 'CE',
  'Electrical Engineering': 'EE',
  'Information Technology': 'IT',
  'Artificial Intelligence & Data Science': 'AI&DS',
  'Electronics & Electrical Engineering': 'EEE',
  'Chemical Engineering': 'CHE',
  'Aerospace Engineering': 'AERO',
  'Automobile Engineering': 'AUTO',
  'Biotechnology Engineering': 'BT',
  'Master of Computer Applications': 'MCA'
};
const VALID_DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EE', 'IT', 'AI&DS', 'EEE', 'CHE', 'AERO', 'AUTO', 'BT', 'MCA'];
const TITLE_REGEX = /^[A-Za-z ]+$/;
const COMPANY_REGEX = /^[A-Za-z ]+$/;
const DESCRIPTION_REGEX = /^[A-Za-z0-9 .,;:()'"\/&+-]+$/;
const LOCATION_REGEX = /^[A-Za-z ,.-]+$/;
const SALARY_REGEX = /^\d+(\.\d{1,2})?$/;
const SKILLS_REGEX = /^[A-Za-z ]+(,\s*[A-Za-z ]+)*$/;
const BATCH_REGEX = /^20\d{2}(\s*,\s*20\d{2})*$/;

const getEffectiveStatus = job => {
  if (job?.status === 'CLOSED') return 'CLOSED';
  if (!job?.applicationDeadline) return job?.status || 'DRAFT';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(job.applicationDeadline);
  deadline.setHours(0, 0, 0, 0);

  if (deadline <= today) return 'CLOSED';
  return job?.status || 'DRAFT';
};

const normalizeDepartments = value =>
  value
    .split(',')
    .map(dept => dept.trim().toUpperCase())
    .filter(Boolean)
    .join(', ');

const normalizeSkills = value =>
  value
    .split(',')
    .map(skill => skill.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .join(', ');

const normalizeBatchYears = value =>
  value
    .split(',')
    .map(year => year.trim())
    .filter(Boolean)
    .join(', ');

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editJob, setEditJob] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const set = k => e => {
    const value = e.target.value;
    setForm(prev => {
      const nextForm = { ...prev, [k]: value };
      setFieldErrors(prevErrors => ({ ...prevErrors, [k]: validateField(k, nextForm) }));
      return nextForm;
    });
  };

  const fetchJobs = () => {
    setLoading(true);
    adminService.getAllJobs().then(r => setJobs(r.data)).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(fetchJobs, []);

  const validateField = (field, values = form) => {
    const title = values.title.trim();
    const companyName = values.companyName.trim();
    const description = values.description.trim().replace(/\s+/g, ' ');
    const location = values.location.trim();
    const salaryPackage = values.salaryPackage.trim();
    const eligibleBranches = normalizeDepartments(values.eligibleBranches);
    const eligibleBatches = normalizeBatchYears(values.eligibleBatches || '');
    const skills = normalizeSkills(values.skills);
    const cgpa = Number(values.minimumCgpa);
    const positions = Number(values.totalPositions);
    const deadline = values.applicationDeadline ? new Date(values.applicationDeadline) : null;
    const departments = eligibleBranches.split(',').map(dept => dept.trim()).filter(Boolean);

    switch (field) {
      case 'title':
        if (!title) return 'Job title is required.';
        if (title.length < 2 || title.length > 100) return 'Job title must be between 2 and 100 characters.';
        if (!TITLE_REGEX.test(title)) return 'Job title must contain letters and spaces only.';
        return '';
      case 'companyName':
        if (!companyName) return 'Company name is required.';
        if (companyName.length < 2 || companyName.length > 100) return 'Company name must be between 2 and 100 characters.';
        if (!COMPANY_REGEX.test(companyName)) return 'Company name must contain letters and spaces only.';
        return '';
      case 'description':
        if (!description) return 'Job description is required.';
        if (description.length < 10 || description.length > 2000) return 'Job description must be between 10 and 2000 characters.';
        if (!DESCRIPTION_REGEX.test(description)) return 'Job description can contain letters, numbers, spaces, and basic punctuation only.';
        return '';
      case 'location':
        if (!location) return 'Location is required.';
        if (location.length < 2 || location.length > 100) return 'Location must be between 2 and 100 characters.';
        if (!LOCATION_REGEX.test(location)) return 'Location must contain letters only.';
        return '';
      case 'salaryPackage':
        if (!salaryPackage) return 'Salary/package is required.';
        if (!SALARY_REGEX.test(salaryPackage)) return 'Enter a valid salary.';
        return '';
      case 'totalPositions':
        if (!values.totalPositions) return 'Total positions is required.';
        if (!Number.isInteger(positions) || positions < 1) return 'Total positions must be a whole number greater than 0.';
        return '';
      case 'minimumCgpa':
        if (values.minimumCgpa === '' || Number.isNaN(cgpa)) return 'Minimum CGPA is required.';
        if (cgpa < 0 || cgpa > 10) return 'Minimum CGPA must be between 0 and 10.';
        return '';
      case 'applicationDeadline':
        if (!values.applicationDeadline) return 'Application deadline is required.';
        if (deadline) {
          deadline.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (deadline < today) return 'Application deadline must be today or a future date.';
        }
        return '';
      case 'eligibleBranches':
        if (!eligibleBranches) return 'Eligible departments are required.';
        if (departments.some(dept => !VALID_DEPARTMENTS.includes(dept))) return 'Invalid depts.';
        return '';
      case 'eligibleBatches':
        if (!eligibleBatches) return 'Eligible batches are required.';
        if (!BATCH_REGEX.test(eligibleBatches)) return 'Enter valid batch years like 2024, 2025.';
        return '';
      case 'skills':
        if (!skills) return 'Required skills are required.';
        if (!SKILLS_REGEX.test(skills)) return 'Skills must contain letters only and be comma separated.';
        return '';
      default:
        return '';
    }
  };

  const getValidationErrors = (values = form) => {
    const fields = [
      'title',
      'companyName',
      'description',
      'location',
      'salaryPackage',
      'totalPositions',
      'minimumCgpa',
      'applicationDeadline',
      'eligibleBranches',
      'eligibleBatches',
      'skills',
    ];

    return fields.reduce((errors, field) => {
      const message = validateField(field, values);
      if (message) errors[field] = message;
      return errors;
    }, {});
  };

  const openCreate = () => { setForm(EMPTY); setFieldErrors({}); setEditJob(null); setShowModal(true); };
  const openEdit = job => {
    setForm({
      title: job.title || '', companyName: job.companyName || '', description: job.description || '',
      location: job.location || '', jobType: job.jobType || 'Full-time', salaryPackage: job.salaryPackage || '',
      eligibleBranches: job.eligibleBranches || '', eligibleBatches: job.eligibleBatches || '', minimumCgpa: job.minimumCgpa || '',
      skills: job.skills || '', applicationDeadline: job.applicationDeadline || '',
      totalPositions: job.totalPositions || '', status: job.status || 'ACTIVE',
    });
    setFieldErrors({});
    setEditJob(job);
    setShowModal(true);
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    const validationErrors = getValidationErrors();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      if (Object.keys(validationErrors).length > 2) {
        toast.error('Invalid details');
      }
      setSaving(false);
      return;
    }
    try {
      const payload = {
        ...form,
        title: form.title.trim().replace(/\s+/g, ' '),
        companyName: form.companyName.trim().replace(/\s+/g, ' '),
        description: form.description.trim().replace(/\s+/g, ' '),
        location: form.location.trim().replace(/\s+/g, ' '),
        salaryPackage: form.salaryPackage.trim(),
        eligibleBranches: normalizeDepartments(form.eligibleBranches),
        eligibleBatches: normalizeBatchYears(form.eligibleBatches),
        skills: normalizeSkills(form.skills),
        minimumCgpa: form.minimumCgpa ? parseFloat(form.minimumCgpa) : null,
        totalPositions: form.totalPositions ? parseInt(form.totalPositions, 10) : null,
      };
      if (editJob) { await adminService.updateJob(editJob.id, payload); toast.success('Job updated!'); }
      else { await adminService.createJob(payload); toast.success('Job created!'); }
      setShowModal(false); fetchJobs();
    } catch (error) { toast.error(error.response?.data?.message || 'Failed to save job.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this job posting?')) return;
    try { await adminService.deleteJob(id); toast.success('Job deleted.'); fetchJobs(); }
    catch { toast.error('Delete failed.'); }
  };

  const statusBadge = s => {
    if (s === 'ACTIVE') return <span className="badge badge-active">Active</span>;
    if (s === 'CLOSED') return <span className="badge badge-closed">Closed</span>;
    return <span className="badge badge-pending">Draft</span>;
  };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Manage Jobs</div><div className="topbar-sub">Create and manage job postings for students</div></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Job</button>
      </div>
      <div className="page-content">
        {loading && <div className="spinner-wrap"><div className="spinner" /></div>}
        {!loading && jobs.length === 0 && (
          <div className="card" style={{ textAlign: 'center', padding: 40 }}>
            <p style={{ color: 'var(--gray-400)', marginBottom: 16 }}>No jobs posted yet.</p>
            <button className="btn btn-primary" onClick={openCreate}>Create Your First Job</button>
          </div>
        )}

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {jobs.length > 0 && (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Job Title</th><th>Company</th><th>Type</th><th>Package</th><th>Deadline</th><th>Applicants</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {jobs.map(j => (
                    <tr key={j.id}>
                      <td style={{ fontWeight: 500 }}>{j.title}</td>
                      <td>{j.companyName}</td>
                      <td style={{ fontSize: 12 }}>{j.jobType || '—'}</td>
                      <td style={{ fontSize: 12 }}>{j.salaryPackage || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{j.applicationDeadline ? new Date(j.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--navy)' }}>{j.applicantCount}</td>
                      <td>{statusBadge(getEffectiveStatus(j))}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-info" onClick={() => navigate(`/admin/jobs/${j.id}/applicants`)}>Applicants</button>
                          <button className="btn btn-sm btn-outline" onClick={() => openEdit(j)}>Edit</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(j.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">{editJob ? 'Edit Job' : 'Create New Job'}</h3>
            <form onSubmit={handleSave}>
              <div className="form-row">
                <div className="form-group">
                  <label>Job Title</label>
                  <input type="text" required value={form.title} onChange={set('title')} className={fieldErrors.title ? 'input-error' : ''} />
                  {fieldErrors.title && <div className="field-error">{fieldErrors.title}</div>}
                </div>
                <div className="form-group">
                  <label>Company Name</label>
                  <input type="text" required value={form.companyName} onChange={set('companyName')} className={fieldErrors.companyName ? 'input-error' : ''} />
                  {fieldErrors.companyName && <div className="field-error">{fieldErrors.companyName}</div>}
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} required value={form.description} onChange={set('description')} className={fieldErrors.description ? 'input-error' : ''} />
                {fieldErrors.description && <div className="field-error">{fieldErrors.description}</div>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" required value={form.location} onChange={set('location')} className={fieldErrors.location ? 'input-error' : ''} />
                  {fieldErrors.location && <div className="field-error">{fieldErrors.location}</div>}
                </div>
                <div className="form-group"><label>Job Type</label>
                  <select required value={form.jobType} onChange={set('jobType')}>
                    <option>Full-time</option><option>Internship</option><option>Contract</option><option>Part-time</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Salary / Package</label>
                  <input type="text" required value={form.salaryPackage} onChange={set('salaryPackage')} className={fieldErrors.salaryPackage ? 'input-error' : ''} />
                  {fieldErrors.salaryPackage && <div className="field-error">{fieldErrors.salaryPackage}</div>}
                </div>
                <div className="form-group">
                  <label>Total Positions</label>
                  <input type="number" min="1" step="1" required value={form.totalPositions} onChange={set('totalPositions')} className={fieldErrors.totalPositions ? 'input-error' : ''} />
                  {fieldErrors.totalPositions && <div className="field-error">{fieldErrors.totalPositions}</div>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Minimum CGPA</label>
                  <input type="number" min="0" max="10" step="0.1" required value={form.minimumCgpa} onChange={set('minimumCgpa')} className={fieldErrors.minimumCgpa ? 'input-error' : ''} />
                  {fieldErrors.minimumCgpa && <div className="field-error">{fieldErrors.minimumCgpa}</div>}
                </div>
                <div className="form-group">
                  <label>Application Deadline</label>
                  <input type="date" required value={form.applicationDeadline} onChange={set('applicationDeadline')} className={fieldErrors.applicationDeadline ? 'input-error' : ''} />
                  {fieldErrors.applicationDeadline && <div className="field-error">{fieldErrors.applicationDeadline}</div>}
                </div>
              </div>
              <div className="form-group">
                <label>Eligible Departments (comma separated abbreviations)</label>
                <input type="text" required value={form.eligibleBranches} onChange={set('eligibleBranches')} className={fieldErrors.eligibleBranches ? 'input-error' : ''} />
                {fieldErrors.eligibleBranches && <div className="field-error">{fieldErrors.eligibleBranches}</div>}
              </div>
              <div className="form-group">
                <label>Eligible Batches (comma separated years)</label>
                <input type="text" required value={form.eligibleBatches} onChange={set('eligibleBatches')} className={fieldErrors.eligibleBatches ? 'input-error' : ''} />
                {fieldErrors.eligibleBatches && <div className="field-error">{fieldErrors.eligibleBatches}</div>}
              </div>
              <div className="form-group">
                <label>Required Skills (comma separated)</label>
                <input type="text" required value={form.skills} onChange={set('skills')} className={fieldErrors.skills ? 'input-error' : ''} />
                {fieldErrors.skills && <div className="field-error">{fieldErrors.skills}</div>}
              </div>
              <div className="form-group"><label>Status</label>
                <select required value={form.status} onChange={set('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                  {editJob && form.status === 'CLOSED' && <option value="CLOSED">Closed</option>}
                </select>
              </div>
              <div className="btn-row">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editJob ? 'Update Job' : 'Create Job'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
