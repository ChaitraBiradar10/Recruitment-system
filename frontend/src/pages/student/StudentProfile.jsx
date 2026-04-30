import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { studentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const DEPTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Information Technology',
  'Artificial Intelligence & Data Science',
  'Electronics & Electrical Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Automobile Engineering',
  'Biotechnology Engineering',
  'Master of Computer Applications',
];

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  phone: '',
  gender: '',
  dateOfBirth: '',
  department: '',
  batchYear: '',
  cgpa: '',
  rollNumber: '',
  skills: '',
  linkedinUrl: '',
  coverNote: '',
};

const ALLOWED_RESUME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function mapProfileToForm(profile = {}) {
  return {
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    phone: profile.phone || '',
    gender: profile.gender || '',
    dateOfBirth: profile.dateOfBirth || '',
    department: profile.department || '',
    batchYear: profile.batchYear || '',
    cgpa: profile.cgpa || '',
    rollNumber: profile.rollNumber || '',
    skills: profile.skills || '',
    linkedinUrl: profile.linkedinUrl || '',
    coverNote: profile.coverNote || '',
  };
}

function formatBytes(bytes) {
  if (!bytes) return '';
  return bytes < 1048576
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1048576).toFixed(2)} MB`;
}

function validateResume(file) {
  if (!file) return null;
  if (!ALLOWED_RESUME_TYPES.includes(file.type)) {
    return 'Resume must be a PDF or DOCX file.';
  }
  if (file.size > 5 * 1024 * 1024) {
    return 'Resume file size must not exceed 5 MB.';
  }
  return null;
}

export default function StudentProfile() {
  const { updateUser } = useAuth();
  const [form, setForm] = useState(EMPTY_FORM);
  const [savedForm, setSavedForm] = useState(EMPTY_FORM);
  const [resumeInfo, setResumeInfo] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const set = key => event => setForm(prev => ({ ...prev, [key]: event.target.value }));

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await studentService.getProfile();
        const mappedForm = mapProfileToForm(data);
        setForm(mappedForm);
        setSavedForm(mappedForm);
        setResumeInfo(data.resume || null);
      } catch {
        toast.error('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleResumeSelection = event => {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    if (!file) return;

    const error = validateResume(file);
    if (error) {
      toast.error(error);
      return;
    }

    setSelectedResume(file);
  };

  const handleResumeDownload = async (forceDownload = false) => {
    if (!resumeInfo) return;

    try {
      const { data } = await studentService.downloadResume();
      const blob = new Blob([data], {
        type: resumeInfo.fileType || 'application/octet-stream',
      });
      const url = URL.createObjectURL(blob);

      if (!forceDownload && resumeInfo.fileType === 'application/pdf') {
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        return;
      }

      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = resumeInfo.originalFileName || 'resume';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to open resume.');
    }
  };

  const handleCancel = () => {
    setForm(savedForm);
    setSelectedResume(null);
    setIsEditing(false);
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);

    try {
      const { data } = await studentService.updateProfile(form);
      const mappedForm = mapProfileToForm(data);

      setForm(mappedForm);
      setSavedForm(mappedForm);
      setResumeInfo(data.resume || resumeInfo);

      updateUser({
        firstName: data.firstName,
        lastName: data.lastName,
        department: data.department,
        skills: data.skills,
        cgpa: data.cgpa,
        batchYear: data.batchYear,
        phone: data.phone,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        rollNumber: data.rollNumber,
        linkedinUrl: data.linkedinUrl,
        coverNote: data.coverNote,
      });

      if (selectedResume) {
        try {
          const uploadResponse = await studentService.uploadResume(selectedResume);
          setResumeInfo(uploadResponse.data.data);
          setSelectedResume(null);
        } catch (error) {
          toast.error(error.response?.data?.message || 'Profile updated, but resume upload failed.');
          return;
        }
      }

      toast.success(selectedResume ? 'Profile and resume updated successfully!' : 'Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="spinner-wrap">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (!isEditing) {
    return (
      <>
        <div className="topbar">
          <div>
            <div className="topbar-title">My Profile</div>
            <div className="topbar-sub">Your academic and personal information</div>
          </div>
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        </div>

        <div className="page-content">
          <div className="card">
            <div className="card-title">Personal Information</div>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)', fontWeight: 500 }}>
                  {form.firstName || '-'}
                </div>
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)', fontWeight: 500 }}>
                  {form.lastName || '-'}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)' }}>
                  {form.phone || '-'}
                </div>
              </div>
              <div className="form-group">
                <label>Gender</label>
                <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)' }}>
                  {form.gender || '-'}
                </div>
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 260 }}>
              <label>Date of Birth</label>
              <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)' }}>
                {form.dateOfBirth || '-'}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Academic Details</div>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)' }}>
                  {form.department || '-'}
                </div>
              </div>
              <div className="form-group">
                <label>Batch Year</label>
                <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)' }}>
                  {form.batchYear || '-'}
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>CGPA</label>
                <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)' }}>
                  {form.cgpa || '-'}
                </div>
              </div>
              <div className="form-group">
                <label>Roll Number</label>
                <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)', fontWeight: 500 }}>
                  {form.rollNumber || '-'}
                </div>
              </div>
            </div>
            <div className="form-group">
              <label>Skills</label>
              <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)' }}>
                {form.skills || '-'}
              </div>
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)', wordBreak: 'break-all' }}>
                {form.linkedinUrl ? (
                  <a href={form.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)' }}>
                    {form.linkedinUrl}
                  </a>
                ) : (
                  '-'
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title">Resume</div>
            {resumeInfo ? (
              <>
                <div className="file-badge" style={{ marginTop: 0 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--info)">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  </svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>
                      {resumeInfo.originalFileName}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                      {formatBytes(resumeInfo.fileSize)}
                      {resumeInfo.uploadedAt ? ` - Uploaded ${new Date(resumeInfo.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </div>
                  </div>
                </div>
                <div className="btn-row">
                  <button type="button" className="btn btn-outline" onClick={() => handleResumeDownload(false)}>
                    View Resume
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => handleResumeDownload(true)}>
                    Download Resume
                  </button>
                </div>
              </>
            ) : (
              <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)' }}>
                No resume uploaded yet.
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Career Note</div>
            <div className="form-group">
              <label>Cover Note</label>
              <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {form.coverNote || '-'}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Edit Profile</div>
          <div className="topbar-sub">Update your academic details, personal info, and resume</div>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit}>
          <div className="card">
            <div className="card-title">Personal Information</div>
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" value={form.firstName} onChange={set('firstName')} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" value={form.lastName} onChange={set('lastName')} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input type="text" value={form.phone} onChange={set('phone')} />
              </div>
              <div className="form-group">
                <label>Gender</label>
                <select value={form.gender} onChange={set('gender')}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div className="form-group" style={{ maxWidth: 260 }}>
              <label>Date of Birth</label>
              <input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Academic Details</div>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select value={form.department} onChange={set('department')}>
                  <option value="">Select department</option>
                  {DEPTS.map(dept => (
                    <option key={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Batch Year</label>
                <input type="text" value={form.batchYear} onChange={set('batchYear')} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>CGPA</label>
                <input type="text" value={form.cgpa} onChange={set('cgpa')} />
              </div>
              <div className="form-group">
                <label>Roll Number</label>
                <input type="text" value={form.rollNumber} onChange={set('rollNumber')} />
              </div>
            </div>
            <div className="form-group">
              <label>Skills (comma separated)</label>
              <input type="text" value={form.skills} onChange={set('skills')} />
            </div>
            <div className="form-group">
              <label>LinkedIn URL</label>
              <input type="text" value={form.linkedinUrl} onChange={set('linkedinUrl')} />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Resume</div>
            {resumeInfo ? (
              <div className="file-badge" style={{ marginTop: 0, marginBottom: 16 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--info)">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>
                    {resumeInfo.originalFileName}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    {formatBytes(resumeInfo.fileSize)}
                  </div>
                </div>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => handleResumeDownload(false)}>
                  View
                </button>
              </div>
            ) : (
              <div style={{ padding: '10px 12px', background: 'var(--gray-50)', borderRadius: '8px', color: 'var(--text)', marginBottom: 16 }}>
                No resume uploaded yet.
              </div>
            )}

            <div className="form-group">
              <label>{resumeInfo ? 'Replace Resume' : 'Upload Resume'}</label>
              <input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleResumeSelection}
              />
              <div className="form-hint">PDF or DOCX only. Maximum size 5 MB.</div>
            </div>

            {selectedResume && (
              <div className="file-badge">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--info)">
                  <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                </svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>
                    {selectedResume.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                    Selected for upload - {formatBytes(selectedResume.size)}
                  </div>
                </div>
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setSelectedResume(null)}>
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-title">Career Note</div>
            <div className="form-group">
              <label>Cover Note (Optional)</label>
              <textarea rows={4} value={form.coverNote} onChange={set('coverNote')} />
            </div>
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn-outline" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
