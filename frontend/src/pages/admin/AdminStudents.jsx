import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
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

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const getDeptAbbr = (dept) => {
    if (!dept) return '—';
    return DEPT_ABBR[dept] || dept;
  };

  useEffect(() => {
    adminService.getAllStudents()
      .then(r => { const s = [...r.data].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); setStudents(s); setFiltered(s); })
      .catch(() => toast.error('Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  const departments = ['ALL', ...new Set(students.map(s => getDeptAbbr(s.department)).filter(Boolean))];

  useEffect(() => {
    let r = [...students];
    if (deptFilter !== 'ALL') r = r.filter(s => getDeptAbbr(s.department) === deptFilter);
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter(s => [s.firstName,s.lastName,s.email,s.rollNumber].join(' ').toLowerCase().includes(q)); }
    setFiltered(r);
  }, [search, deptFilter, students]);

  const download = async s => {
    if (!s.hasResume) return;
    try {
      const { data } = await adminService.downloadResume(s.id);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href=url; a.download=s.resume?.originalFileName||'cv'; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Download failed.'); }
  };

  const REG_BADGE = { PENDING:<span className="badge badge-pending">Pending</span>, APPROVED:<span className="badge badge-approved">Approved</span>, REJECTED:<span className="badge badge-rejected">Rejected</span> };
  const APP_BADGE = { NOT_SUBMITTED:<span className="badge badge-pending">—</span>, SUBMITTED:<span className="badge badge-submitted">Submitted</span>, UNDER_REVIEW:<span className="badge badge-review">Reviewing</span>, SHORTLISTED:<span className="badge badge-shortlisted">Shortlisted</span>, REJECTED:<span className="badge badge-rejected">Not Selected</span> };

  return (
    <>
      <div className="topbar">
        <div><div className="topbar-title">All Students</div><div className="topbar-sub">Complete student directory</div></div>
        <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>{filtered.length} of {students.length}</span>
      </div>
      <div className="page-content">
        <div className="search-bar">
          <input className="search-input" placeholder="Search by name, email or roll number…" value={search} onChange={e=>setSearch(e.target.value)} />
          <select className="filter-select" value={deptFilter} onChange={e=>setDeptFilter(e.target.value)}>
            {departments.map(d=><option key={d} value={d}>{d==='ALL'?'All Departments':d}</option>)}
          </select>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Student</th><th>Roll No.</th><th>Dept</th><th>CGPA</th><th>Phone</th><th>Reg. Status</th><th>CV Status</th><th>CV</th></tr></thead>
              <tbody>
                {loading && <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'var(--gray-400)' }}>Loading…</td></tr>}
                {!loading && filtered.length===0 && <tr><td colSpan={8} style={{ textAlign:'center', padding:32, color:'var(--gray-400)' }}>No students found.</td></tr>}
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="avatar avatar-sm">{s.firstName?.[0]}{s.lastName?.[0]}</div>
                        <div>
                          <div style={{ fontWeight:500, fontSize:13 }}>{s.firstName} {s.lastName}</div>
                          <div style={{ fontSize:11, color:'var(--gray-400)' }}>{s.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:12 }}>{s.rollNumber}</td>
                    <td style={{ fontSize:12 }}>{getDeptAbbr(s.department)}</td>
                    <td style={{ fontWeight:600, color: parseFloat(s.cgpa)>=8?'var(--success)':'inherit' }}>{s.cgpa||'—'}</td>
                    <td style={{ fontSize:12, color:'var(--gray-400)' }}>{s.phone||'—'}</td>
                    <td>{REG_BADGE[s.registrationStatus]||REG_BADGE.PENDING}</td>
                    <td>{APP_BADGE[s.applicationStatus]||APP_BADGE.NOT_SUBMITTED}</td>
                    <td>
                      {s.hasResume
                        ? <button className="btn btn-sm btn-info" onClick={()=>download(s)}>📄 CV</button>
                        : <span style={{ fontSize:12, color:'var(--gray-200)' }}>—</span>}
                    </td>
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
