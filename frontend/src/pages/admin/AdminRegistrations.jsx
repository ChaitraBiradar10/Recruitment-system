import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';

const styles = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

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

export default function AdminRegistrations() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [batchYearFilter, setBatchYearFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionId, setActionId] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const getDeptAbbr = (dept) => {
    if (!dept) return '—';
    return DEPT_ABBR[dept] || dept;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllStudents();
      let source = Array.isArray(data) ? data : [];

      // Fallback to the registrations endpoint if the broader student list is unexpectedly empty.
      if (source.length === 0) {
        const pendingResponse = await adminService.getPending();
        source = Array.isArray(pendingResponse.data) ? pendingResponse.data : [];
      }

      const sorted = [...source].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setStudents(sorted);
      setFiltered(sorted);
    } catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  };
  
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);
  
  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let r = [...students];
    if (statusFilter !== 'ALL') r = r.filter(s => s.registrationStatus === statusFilter);
    if (departmentFilter !== 'ALL') r = r.filter(s => s.department === departmentFilter);
    if (batchYearFilter !== 'ALL') r = r.filter(s => String(s.batchYear || '') === batchYearFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(s => [
        s.firstName,
        s.lastName,
        s.email,
        s.rollNumber,
        s.department,
        getDeptAbbr(s.department),
        s.batchYear,
      ].join(' ').toLowerCase().includes(q));
    }
    setFiltered(r);
  }, [search, departmentFilter, batchYearFilter, statusFilter, students]);

  const counts = {
    PENDING: students.filter(s => s.registrationStatus === 'PENDING').length,
    APPROVED: students.filter(s => s.registrationStatus === 'APPROVED').length,
    REJECTED: students.filter(s => s.registrationStatus === 'REJECTED').length,
    ALL: students.length,
  };
  const departments = Object.keys(DEPT_ABBR).filter(dept => students.some(student => student.department === dept));
  const batchYears = [...new Set(students.map(student => student.batchYear).filter(Boolean))].sort((a, b) => Number(b) - Number(a));

  const doAction = async (id, action) => {
    setActionId(id + action);
    try {
      let response;

      if (action === 'approve') {
        response = await adminService.approveReg(id);
        toast.success(response.data?.message || 'Approved! Email sent.');
      } else {
        if (!window.confirm('Reject this registration?')) return;
        response = await adminService.rejectReg(id);
        toast.success(response.data?.message || 'Rejected. Student notified.');
      }

      const updatedStudent = response.data?.data;
      if (updatedStudent) {
        setStudents(prev => prev.map(student => (
          student.id === id ? { ...student, ...updatedStudent } : student
        )));
      }

      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    }
    finally { setActionId(null); }
  };

  const badge = s => {
    if (s === 'APPROVED') return <span className="badge badge-approved">Approved</span>;
    if (s === 'REJECTED') return <span className="badge badge-rejected">Rejected</span>;
    return <span className="badge badge-pending">Pending</span>;
  };

  const StudentDetailsModal = ({ student, onClose }) => {
    if (!student) return null;
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000
      }} onClick={onClose}>
        <div style={{
          background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          maxWidth: 600, width: '90%', maxHeight: '85vh', overflow: 'auto',
          animation: 'slideUp 0.3s ease'
        }} onClick={e => e.stopPropagation()}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid var(--gray-200)'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
                {student.firstName} {student.lastName}
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--gray-400)' }}>{student.email}</p>
            </div>
            <button onClick={onClose} style={{
              background: 'none', border: 'none', fontSize: 24, color: 'var(--gray-400)',
              cursor: 'pointer', padding: 0, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>×</button>
          </div>

          <div style={{ padding: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>First Name</label>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginTop: 4 }}>{student.firstName}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Last Name</label>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginTop: 4 }}>{student.lastName}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Email</label>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4, wordBreak: 'break-all' }}>{student.email}</div>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Roll Number</label>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginTop: 4 }}>{student.rollNumber}</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', margin: '0 0 16px 0' }}>Academic Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Department</label>
                  <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{getDeptAbbr(student.department)}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Batch Year</label>
                  <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{student.batchYear || '—'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>CGPA</label>
                  <div style={{ fontSize: 14, fontWeight: 500, color: parseFloat(student.cgpa) >= 8 ? 'var(--success)' : 'var(--text)', marginTop: 4 }}>{student.cgpa || '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', margin: '0 0 16px 0' }}>Personal Details</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Phone</label>
                  <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{student.phone || '—'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Gender</label>
                  <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{student.gender || '—'}</div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Date of Birth</label>
                  <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{student.dateOfBirth || '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 20, marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', margin: '0 0 16px 0' }}>Professional Details</h3>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Skills</label>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{student.skills || '—'}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>LinkedIn URL</label>
                <div style={{ fontSize: 14, marginTop: 4 }}>
                  {student.linkedinUrl ? (
                    <a href={student.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', textDecoration: 'none' }}>
                      {student.linkedinUrl}
                    </a>
                  ) : '—'}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Cover Note</label>
                <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                  {student.coverNote || '—'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Registration Status</label>
              <div style={{ marginTop: 8 }}>{badge(student.registrationStatus)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Registration Requests</div>
          <div className="topbar-sub">Review and approve student registrations</div>
        </div>
      </div>
      <div className="page-content">
        <div className="filter-tabs">
          {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
            <button key={s} className={`filter-tab${statusFilter === s ? ' active' : ''}`} onClick={() => setStatusFilter(s)}>
              {s === 'ALL' ? `All Students (${counts.ALL})` : `${s.charAt(0) + s.slice(1).toLowerCase()} (${counts[s]})`}
            </button>
          ))}
        </div>
        <div className="search-bar" style={{ alignItems: 'stretch' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            border: '1.5px solid var(--gray-200)',
            borderRadius: 'var(--radius)',
            background: 'var(--white)',
          }}>
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              style={{ width: 18, height: 18, color: 'var(--gray-400)', flexShrink: 0 }}
            >
              <path
                fill="currentColor"
                d="M10 4a6 6 0 1 0 3.874 10.582l4.272 4.272 1.414-1.414-4.272-4.272A6 6 0 0 0 10 4Zm0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"
              />
            </svg>
            <input
              className="search-input"
              style={{ border: 'none', paddingLeft: 0, paddingRight: 0 }}
              placeholder="Search by name, email, roll number, department, or batch year..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="btn btn-sm btn-outline"
                style={{ whiteSpace: 'nowrap' }}
                onClick={() => setSearch('')}
              >
                Clear
              </button>
            )}
          </div>
          <select className="filter-select" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)}>
            <option value="ALL">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{getDeptAbbr(dept)}</option>
            ))}
          </select>
          <select className="filter-select" value={batchYearFilter} onChange={e => setBatchYearFilter(e.target.value)}>
            <option value="ALL">All Batch Years</option>
            {batchYears.map(year => (
              <option key={year} value={String(year)}>{year}</option>
            ))}
          </select>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Student</th><th>Roll No.</th><th>Department</th><th>Batch</th><th>Submitted</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>Loading…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>No registrations found.</td></tr>}
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setSelectedStudent(s)}>
                        <div className="avatar avatar-sm">{s.firstName?.[0]}{s.lastName?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: 13, color: 'var(--navy)' }}>{s.firstName} {s.lastName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{s.rollNumber}</td>
                    <td style={{ fontSize: 12 }}>{getDeptAbbr(s.department)}</td>
                    <td style={{ fontSize: 12 }}>{s.batchYear || '—'}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                    <td>{badge(s.registrationStatus)}</td>
                    <td>
                      {s.registrationStatus === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-sm btn-success" disabled={actionId === s.id + 'approve'} onClick={() => doAction(s.id, 'approve')}>Approve</button>
                          <button className="btn btn-sm btn-danger" disabled={actionId === s.id + 'reject'} onClick={() => doAction(s.id, 'reject')}>Reject</button>
                        </div>
                      ) : <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>{s.registrationStatus === 'APPROVED' ? `Approved ${s.approvedAt ? new Date(s.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}` : 'Rejected'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <StudentDetailsModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
    </>
  );
}
