import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';
import AdminRoundScheduling from './AdminRoundScheduling';

const styles = `
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const STATUS_CFG = {
  APPLIED: { label: 'Applied', cls: 'badge-applied' },
  APTITUDE_SCHEDULED: { label: 'Applied', cls: 'badge-applied' },
  APTITUDE_CLEARED: { label: 'Applied', cls: 'badge-applied' },
  APTITUDE_FAILED: { label: 'Applied', cls: 'badge-applied' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', cls: 'badge-shortlisted' },
  SELECTED: { label: 'Selected', cls: 'badge-selected' },
  REJECTED: { label: 'Rejected', cls: 'badge-rejected' },
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
  'Master of Computer Applications': 'MCA',
};

const getDeptFullName = deptAbbr => {
  if (!deptAbbr) return '--';
  const normalizedDept = `${deptAbbr}`.trim().toLowerCase();
  return Object.entries(DEPT_ABBR).find(([, abbr]) => abbr.toLowerCase() === normalizedDept)?.[0] || deptAbbr;
};

const getStatusConfig = applicant => {
  if (['SELECTED', 'REJECTED'].includes(applicant?.status)) {
    return STATUS_CFG[applicant.status] || { label: applicant.status, cls: 'badge-pending' };
  }

  if (applicant?.currentRoundDisplayStatus) {
    return {
      label: applicant.currentRoundDisplayStatus,
      cls: applicant.currentRoundStatus === 'COMPLETED' ? 'badge-approved' : 'badge-shortlisted',
    };
  }

  return STATUS_CFG[applicant?.status] || { label: applicant?.status, cls: 'badge-pending' };
};

export default function AdminJobApplicants() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showRoundScheduling, setShowRoundScheduling] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    setLoading(true);
    adminService.getApplicants(id)
      .then(response => {
        setApplicants(response.data);
        setSelected(prev => response.data.find(app => app.id === prev?.id) || null);
      })
      .catch(error => {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to load applicants.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => styleSheet.remove();
  }, []);

  useEffect(() => {
    fetchData();
  }, [id]);

  const getApplicantFilterLabel = applicant => {
    if (['SELECTED', 'REJECTED'].includes(applicant?.status)) {
      return STATUS_CFG[applicant.status]?.label || applicant.status;
    }
    if (applicant?.currentRoundDisplayStatus) return applicant.currentRoundDisplayStatus;
    return STATUS_CFG[applicant?.status]?.label || applicant?.status || 'Unknown';
  };

  const stageOptions = [
    { value: 'ALL', label: 'All Stages' },
    { value: 'Applied', label: 'Applied' },
    { value: 'Selected', label: 'Selected' },
    { value: 'Rejected', label: 'Rejected' },
    ...[...new Set(applicants.map(getApplicantFilterLabel).filter(Boolean))]
      .filter(label => !['Applied', 'Selected', 'Rejected'].includes(label))
      .sort((a, b) => a.localeCompare(b))
      .map(label => ({ value: label, label })),
  ];

  const filteredApplicants = [...applicants]
    .filter(applicant => {
      if (stageFilter === 'ALL') return true;
      return getApplicantFilterLabel(applicant) === stageFilter;
    })
    .filter(applicant => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      const statusConfig = getStatusConfig(applicant);
      return [
        applicant.studentName,
        applicant.studentEmail,
        applicant.rollNumber,
        applicant.department,
        getDeptFullName(applicant.department),
        applicant.status,
        applicant.currentRoundType,
        applicant.currentRoundStatus,
        applicant.currentRoundNumber ? `round ${applicant.currentRoundNumber}` : '',
        applicant.currentRoundDisplayStatus,
        statusConfig.label,
      ].join(' ').toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

  useEffect(() => {
    if (selected && !filteredApplicants.some(applicant => applicant.id === selected.id)) {
      setSelected(null);
    }
  }, [filteredApplicants, selected]);

  const fetchStudentProfile = async userId => {
    if (!userId) return;
    setProfileLoading(true);
    try {
      const { data } = await adminService.getStudent(userId);
      setStudentProfile(data);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load full profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const doRejectApplicant = async app => {
    if (!window.confirm(`Reject ${app.studentName} from this selection process?`)) return;
    try {
      await adminService.rejectApplicant(app.id);
      toast.success('Applicant rejected.');
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to reject applicant.');
    }
  };

  const openRoundScheduling = app => {
    setSelected(app);
    setShowRoundScheduling(true);
  };

  const openStudentModal = async app => {
    setShowStudentModal(true);
    setStudentProfile(null);
    await fetchStudentProfile(app.userId);
  };

  const closeStudentModal = () => {
    setShowStudentModal(false);
    setStudentProfile(null);
  };

  const downloadApplicantResume = async student => {
    if (!student?.hasResume) {
      toast.error('Resume not available.');
      return;
    }

    try {
      const { data } = await adminService.downloadResume(student.id);
      const url = URL.createObjectURL(new Blob([data]));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = student.resume?.originalFileName || 'resume';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Resume download failed.');
    }
  };

  const renderApplicantActions = app => (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {!['SELECTED', 'REJECTED'].includes(app.status) && (
        <button className="btn btn-sm btn-success" onClick={() => openRoundScheduling(app)}>
          Round Scheduling
        </button>
      )}
      {!['SELECTED', 'REJECTED'].includes(app.status) && <button className="btn btn-sm btn-danger" onClick={() => doRejectApplicant(app)}>Reject</button>}
      {['SELECTED', 'REJECTED'].includes(app.status) && <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Completed</span>}
    </div>
  );

  return (
    <>
      <div className="topbar">
        <div>
          <button
            onClick={() => navigate('/admin/jobs')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gold)', fontSize: 13, marginBottom: 4 }}
          >
            Back to Jobs
          </button>
          <div className="topbar-title">Job Applicants</div>
          <div className="topbar-sub">{filteredApplicants.length} of {applicants.length} applicant{applicants.length !== 1 ? 's' : ''} for this position</div>
        </div>
      </div>

      <div className="page-content">
        <div className="search-bar">
          <input
            className="search-input"
            placeholder="Search by student, email, roll number, selected, rejected, aptitude round scheduled, coding round scheduled..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          <select className="filter-select" value={stageFilter} onChange={event => setStageFilter(event.target.value)}>
            {stageOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 20, alignItems: 'start' }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Dept</th>
                    <th>CGPA</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                        Loading...
                      </td>
                    </tr>
                  )}
                  {!loading && filteredApplicants.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--gray-400)' }}>
                        No applicants found for this search.
                      </td>
                    </tr>
                  )}
                  {filteredApplicants.map(applicant => {
                    const statusConfig = getStatusConfig(applicant);
                    return (
                      <tr
                        key={applicant.id}
                        style={{ cursor: 'pointer', background: selected?.id === applicant.id ? 'var(--off-white)' : '' }}
                        onClick={() => setSelected(selected?.id === applicant.id ? null : applicant)}
                      >
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar avatar-sm">{applicant.studentName?.[0]}</div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{applicant.studentName}</div>
                              <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{applicant.studentEmail}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: 12 }}>{getDeptFullName(applicant.department)}</td>
                        <td style={{ fontWeight: 600 }}>{applicant.cgpa || '--'}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          {new Date(applicant.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td><span className={`badge ${statusConfig.cls}`}>{statusConfig.label}</span></td>
                        <td onClick={event => event.stopPropagation()}>{renderApplicantActions(applicant)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {selected && (
            <div className="card" style={{ position: 'sticky', top: 80 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--navy)' }}>{selected.studentName}</div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', fontSize: 18 }}>
                  x
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {[
                  ['Email', selected.studentEmail],
                  ['Roll No.', selected.rollNumber],
                  ['Department', getDeptFullName(selected.department)],
                  ['CGPA', selected.cgpa || '--'],
                  ['Status', <span className={`badge ${getStatusConfig(selected).cls}`}>{getStatusConfig(selected).label}</span>],
                  selected.interviewResult && ['Decision', selected.interviewResult],
                  selected.interviewNotes && ['Decision Notes', selected.interviewNotes],
                  selected.finalSelected != null && ['Final', selected.finalSelected ? 'Selected' : 'Not Selected'],
                ].filter(Boolean).map(([key, value]) => (
                  <div key={key} style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--gray-100)', paddingBottom: 8 }}>
                    <span style={{ color: 'var(--gray-400)', minWidth: 90, flexShrink: 0 }}>{key}</span>
                    <span style={{ fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                {!['SELECTED', 'REJECTED'].includes(selected.status) && (
                  <button className="btn btn-success btn-full" onClick={() => openRoundScheduling(selected)}>Round Scheduling</button>
                )}
                {!['SELECTED', 'REJECTED'].includes(selected.status) && (
                  <button className="btn btn-danger btn-full" onClick={() => doRejectApplicant(selected)}>Reject Applicant</button>
                )}
                <button className="btn btn-outline btn-full" onClick={() => openStudentModal(selected)}>View Full Profile</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showStudentModal && selected && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeStudentModal}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              maxWidth: 720,
              width: '92%',
              maxHeight: '85vh',
              overflow: 'auto',
              animation: 'slideUp 0.3s ease',
            }}
            onClick={event => event.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                borderBottom: '1px solid var(--gray-200)',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text)' }}>
                  {studentProfile ? `${studentProfile.firstName} ${studentProfile.lastName}` : selected.studentName}
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--gray-400)' }}>
                  {studentProfile?.email || selected.studentEmail}
                </p>
              </div>
              <button
                onClick={closeStudentModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 24,
                  color: 'var(--gray-400)',
                  cursor: 'pointer',
                  padding: 0,
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                x
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {profileLoading ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--gray-400)' }}>Loading full profile...</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: 20 }}>
                    {[
                      ['Roll Number', studentProfile?.rollNumber || selected.rollNumber || '--'],
                      ['Department', getDeptFullName(studentProfile?.department || selected.department)],
                      ['Batch Year', studentProfile?.batchYear || '--'],
                      ['CGPA', studentProfile?.cgpa || selected.cgpa || '--'],
                      ['Phone', studentProfile?.phone || '--'],
                      ['Gender', studentProfile?.gender || '--'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>{label}</label>
                        <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 20, marginBottom: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', margin: '0 0 16px 0' }}>Professional Profile</h3>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Skills</label>
                      <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4, lineHeight: 1.6 }}>{studentProfile?.skills || '--'}</div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>LinkedIn URL</label>
                      <div style={{ fontSize: 14, marginTop: 4 }}>
                        {studentProfile?.linkedinUrl ? (
                          <a href={studentProfile.linkedinUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--navy)', textDecoration: 'none' }}>
                            {studentProfile.linkedinUrl}
                          </a>
                        ) : '--'}
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase' }}>Cover Note</label>
                      <div style={{ fontSize: 14, color: 'var(--text)', marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {studentProfile?.coverNote || '--'}
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 20, marginBottom: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', margin: '0 0 16px 0' }}>Resume</h3>
                    {studentProfile?.hasResume ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, background: 'var(--off-white)', borderRadius: 10, padding: 14 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{studentProfile.resume?.originalFileName || 'Resume'}</div>
                          <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 2 }}>{studentProfile.resume?.fileType || 'Document'}</div>
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={() => downloadApplicantResume(studentProfile)}>Download Resume</button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 14, color: 'var(--gray-400)' }}>Resume not uploaded.</div>
                    )}
                  </div>

                  <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', margin: '0 0 16px 0' }}>Application Status</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                      {[
                        ['Status', <span className={`badge ${getStatusConfig(selected).cls}`}>{getStatusConfig(selected).label}</span>],
                        ['Applied', new Date(selected.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })],
                        selected.interviewResult && ['Decision', selected.interviewResult],
                        selected.interviewNotes && ['Decision Notes', selected.interviewNotes],
                        selected.finalSelected != null && ['Final Decision', selected.finalSelected ? 'Selected' : 'Not Selected'],
                      ].filter(Boolean).map(([key, value]) => (
                        <div key={key} style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--gray-100)', paddingBottom: 10 }}>
                          <span style={{ color: 'var(--gray-400)', minWidth: 110, flexShrink: 0 }}>{key}</span>
                          <span style={{ color: 'var(--text-mid)', fontWeight: 500 }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showRoundScheduling && selected && (
        <div className="modal-overlay" onClick={() => setShowRoundScheduling(false)}>
          <div className="modal" style={{ maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }} onClick={event => event.stopPropagation()}>
            <AdminRoundScheduling appId={selected.id} onBack={() => { setShowRoundScheduling(false); fetchData(); }} />
          </div>
        </div>
      )}
    </>
  );
}
