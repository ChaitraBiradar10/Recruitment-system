import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';

const STATUS_CFG = {
  NOT_SUBMITTED: { label: '—',             cls: 'badge-pending' },
  SUBMITTED:     { label: 'Submitted',     cls: 'badge-submitted' },
  UNDER_REVIEW:  { label: 'Under Review',  cls: 'badge-review' },
  SHORTLISTED:   { label: 'Shortlisted',   cls: 'badge-shortlisted' },
  REJECTED:      { label: 'Not Selected',  cls: 'badge-rejected' },
};

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

export default function AdminCVApplications() {
  const [students, setStudents] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [actionId, setActionId] = useState(null);
  const [detail, setDetail] = useState(null);

  const getDeptAbbr = (dept) => {
    if (!dept) return '—';
    return DEPT_ABBR[dept] || dept;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await adminService.getAllStudents();
      const withCV = data.filter(s => s.registrationStatus === 'APPROVED' && s.applicationStatus && s.applicationStatus !== 'NOT_SUBMITTED')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setStudents(withCV);
    } catch { toast.error('Failed to load.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let r = [...students];
    if (filter !== 'ALL') r = r.filter(s => s.applicationStatus === filter);
    if (search.trim()) { const q = search.toLowerCase(); r = r.filter(s => [s.firstName, s.lastName, s.email, s.department].join(' ').toLowerCase().includes(q)); }
    setFiltered(r);
  }, [search, filter, students]);

  const doAction = async (id, action, label) => {
    setActionId(id + action);
    try {
      if (action === 'shortlist') await adminService.shortlistCV(id);
      else if (action === 'reject') { if (!window.confirm('Reject this CV?')) { setActionId(null); return; } await adminService.rejectCV(id); }
      else await adminService.reviewCV(id);
      toast.success(label);
      if (detail?.id === id) setDetail(null);
      fetchData();
    } catch { toast.error('Action failed.'); }
    finally { setActionId(null); }
  };

  const download = async s => {
    if (!s.hasResume) return;
    try {
      const { data } = await adminService.downloadResume(s.id);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a'); a.href = url; a.download = s.resume?.originalFileName || 'cv'; a.click(); URL.revokeObjectURL(url);
    } catch { toast.error('Download failed.'); }
  };

  const counts = { ALL: students.length, SUBMITTED: students.filter(s => s.applicationStatus === 'SUBMITTED').length, UNDER_REVIEW: students.filter(s => s.applicationStatus === 'UNDER_REVIEW').length, SHORTLISTED: students.filter(s => s.applicationStatus === 'SHORTLISTED').length, REJECTED: students.filter(s => s.applicationStatus === 'REJECTED').length };

  return (
    <>
      <div className="topbar"><div><div className="topbar-title">CV Applications</div><div className="topbar-sub">Review uploaded CVs and shortlist candidates</div></div></div>
      <div className="page-content">
        <div className="filter-tabs">
          {[{k:'ALL',l:'All'},{k:'SUBMITTED',l:'New'},{k:'UNDER_REVIEW',l:'Reviewing'},{k:'SHORTLISTED',l:'Shortlisted'},{k:'REJECTED',l:'Rejected'}].map(f => (
            <button key={f.k} className={`filter-tab${filter===f.k?' active':''}`} onClick={()=>setFilter(f.k)}>{f.l} ({counts[f.k]})</button>
          ))}
        </div>
        <div className="search-bar"><input className="search-input" placeholder="Search student…" value={search} onChange={e=>setSearch(e.target.value)}/></div>

        <div style={{ display: 'grid', gridTemplateColumns: detail ? '1fr 360px' : '1fr', gap: 20, alignItems: 'start' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Student</th><th>Dept</th><th>CGPA</th><th>CV</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>Loading…</td></tr>}
                  {!loading && filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>No applications found.</td></tr>}
                  {filtered.map(s => {
                    const sc = STATUS_CFG[s.applicationStatus] || STATUS_CFG.SUBMITTED;
                    return (
                      <tr key={s.id} style={{ cursor: 'pointer', background: detail?.id === s.id ? 'var(--off-white)' : '' }} onClick={() => setDetail(detail?.id === s.id ? null : s)}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm">{s.firstName?.[0]}{s.lastName?.[0]}</div>
                            <div><div style={{ fontWeight: 500, fontSize: 13 }}>{s.firstName} {s.lastName}</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{s.email}</div></div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{getDeptAbbr(s.department)}</td>
                        <td style={{ fontSize: 13, fontWeight: 600 }}>{s.cgpa || '—'}</td>
                        <td>
                          {s.hasResume
                            ? <button className="btn btn-sm btn-info" onClick={e => { e.stopPropagation(); download(s); }}>📄 CV</button>
                            : <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>—</span>}
                        </td>
                        <td><span className={`badge ${sc.cls}`}>{sc.label}</span></td>
                        <td onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 5 }}>
                            {!['SHORTLISTED','REJECTED'].includes(s.applicationStatus) && <>
                              {s.applicationStatus !== 'UNDER_REVIEW' && <button className="btn btn-sm" style={{ background: '#e8e0f7', color: '#4a1d8c', border: 'none' }} disabled={actionId===s.id+'review'} onClick={()=>doAction(s.id,'review','Marked under review.')}>Review</button>}
                              <button className="btn btn-sm btn-success" disabled={actionId===s.id+'shortlist'} onClick={()=>doAction(s.id,'shortlist','Shortlisted! Email sent.')}>Shortlist</button>
                              <button className="btn btn-sm btn-danger" disabled={actionId===s.id+'reject'} onClick={()=>doAction(s.id,'reject','CV rejected.')}>Reject</button>
                            </>}
                            {['SHORTLISTED','REJECTED'].includes(s.applicationStatus) && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Finalised</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {detail && (
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div className="avatar">{detail.firstName?.[0]}{detail.lastName?.[0]}</div>
                  <div><div style={{ fontWeight: 600 }}>{detail.firstName} {detail.lastName}</div><div style={{ fontSize: 12, color: 'var(--gray-400)' }}>{detail.rollNumber}</div></div>
                </div>
                <button onClick={() => setDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 18 }}>✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, marginBottom: 16 }}>
                {[['Email',detail.email],['Department',getDeptAbbr(detail.department)],['Batch',detail.batchYear||'—'],['CGPA',detail.cgpa||'—'],['Phone',detail.phone||'—'],['Skills',detail.skills||'—']].map(([k,v])=>(
                  <div key={k} style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--gray-400)', minWidth: 80 }}>{k}</span><span style={{ fontWeight: 500, wordBreak: 'break-word' }}>{v}</span></div>
                ))}
              </div>
              {detail.hasResume && (
                <button className="btn btn-info btn-full btn-sm" onClick={() => download(detail)}>📄 Download CV</button>
              )}
              {!['SHORTLISTED','REJECTED'].includes(detail.applicationStatus) && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-success" style={{ flex: 1 }} onClick={() => doAction(detail.id, 'shortlist', 'Shortlisted!')}>Shortlist ✓</button>
                  <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => doAction(detail.id, 'reject', 'Rejected.')}>Reject ✕</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
