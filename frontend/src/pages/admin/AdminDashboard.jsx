import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/api';

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

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [students, setStudents] = useState([]);

  const getDeptAbbr = (dept) => {
    if (!dept) return '—';
    return DEPT_ABBR[dept] || dept;
  };

  useEffect(() => {
    adminService.getDashboard().then(r => setStats(r.data)).catch(() => {});
    adminService.getAllStudents().then(r => {
      setStudents([...r.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    }).catch(() => {});
  }, []);

  const STATS = [
    { label: 'Total Students',    value: stats?.totalStudents       ?? '—', cls: '' },
    { label: 'Pending Approvals', value: stats?.pendingRegistrations ?? '—', cls: 'gold' },
    { label: 'Active Jobs',       value: stats?.activeJobs          ?? '—', cls: 'green' },
    { label: 'Students Selected', value: stats?.selected            ?? '—', cls: 'green' },
  ];

  const regBadge = s => {
    if (s === 'APPROVED') return <span className="badge badge-approved">Approved</span>;
    if (s === 'REJECTED') return <span className="badge badge-rejected">Rejected</span>;
    return <span className="badge badge-pending">Pending</span>;
  };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">Recruitment Overview</div><div className="topbar-sub">Placement Season 2026</div></div>
      </div>
      <div className="page-content">
        <div className="stat-grid">
          {STATS.map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className={`stat-value ${s.cls}`}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-title" style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', marginBottom: 0 }}>Recent Registrations</div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Student</th><th>Department</th><th>Roll No.</th><th>Registered</th><th>Status</th></tr></thead>
              <tbody>
                {students.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>No students yet</td></tr>}
                {students.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{s.firstName?.[0]}{s.lastName?.[0]}</div>
                        <div>
                          <div style={{ fontWeight: 500 }}>{s.firstName} {s.lastName}</div>
                          <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>{getDeptAbbr(s.department)}</td>
                    <td style={{ fontSize: 12 }}>{s.rollNumber}</td>
                    <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>{new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                    <td>{regBadge(s.registrationStatus)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
