import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { studentService, jobService } from '../../services/api';

const APP_STATUS_CFG = {
  APPLIED: { label: 'Applied', cls: 'badge-applied' },
  APTITUDE_SCHEDULED: { label: 'Aptitude Scheduled', cls: 'badge-review' },
  APTITUDE_CLEARED: { label: 'Aptitude Cleared', cls: 'badge-approved' },
  APTITUDE_FAILED: { label: 'Aptitude Failed', cls: 'badge-rejected' },
  INTERVIEW_SCHEDULED: { label: 'Interview Scheduled', cls: 'badge-shortlisted' },
  SELECTED: { label: 'Selected', cls: 'badge-selected' },
  REJECTED: { label: 'Not Selected', cls: 'badge-rejected' },
};

const isAptitudeRound = roundType => (roundType || '').toLowerCase().includes('aptitude');

const getStatusConfig = app => {
  if (app?.status === 'SELECTED' || app?.status === 'REJECTED') {
    return APP_STATUS_CFG[app.status];
  }

  if (app?.currentRoundDisplayStatus) {
    const label = app.currentRoundDisplayStatus;

    if (label.toLowerCase().includes('failed')) {
      return { label, cls: 'badge-rejected' };
    }

    if (label.toLowerCase().includes('cleared') || label.toLowerCase().includes('passed')) {
      return { label, cls: 'badge-approved' };
    }

    if (label.toLowerCase().includes('scheduled')) {
      return {
        label,
        cls: isAptitudeRound(app?.currentRoundType) ? 'badge-review' : 'badge-shortlisted',
      };
    }

    return {
      label,
      cls: app?.currentRoundStatus === 'COMPLETED' ? 'badge-approved' : 'badge-shortlisted',
    };
  }

  if (isAptitudeRound(app?.currentRoundType) && app?.currentRoundStatus === 'SCHEDULED') {
    return APP_STATUS_CFG.APTITUDE_SCHEDULED;
  }

  return APP_STATUS_CFG[app?.status] || { label: app?.status, cls: 'badge-pending' };
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [apps, setApps] = useState([]);

  useEffect(() => {
    studentService.getProfile().then(response => setProfile(response.data)).catch(() => {});
    jobService.getMyApplications().then(response => setApps(response.data)).catch(() => {});
  }, []);

  const appStatus = profile?.applicationStatus || 'NOT_SUBMITTED';
  const profileProgress = [user?.firstName, profile?.phone, profile?.department, profile?.cgpa, profile?.skills, profile?.resume].filter(Boolean).length;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Welcome back, {user?.firstName}</div>
          <div className="topbar-sub">Your placement journey at a glance</div>
        </div>
      </div>

      <div className="page-content">
        {appStatus === 'SHORTLISTED' && (
          <div className="alert alert-success">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Your CV has been shortlisted and forwarded to companies.</span>
          </div>
        )}

        <div className="stat-grid stat-grid-3">
          <div className="stat-card">
            <div className="stat-label">Profile Complete</div>
            <div className="stat-value">{Math.round((profileProgress / 6) * 100)}%</div>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div className="progress-fill" style={{ width: `${(profileProgress / 6) * 100}%` }} />
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Jobs Applied</div>
            <div className="stat-value">{apps.length}</div>
          </div>
        </div>

        {apps.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="card-title" style={{ padding: '20px 24px 0', paddingBottom: 16, borderBottom: '1px solid var(--gray-100)', marginBottom: 0 }}>
              Recent Applications
            </div>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Applied</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.slice(0, 5).map(app => {
                    const statusConfig = getStatusConfig(app);
                    return (
                      <tr key={app.id}>
                        <td style={{ fontWeight: 500 }}>{app.jobTitle}</td>
                        <td>{app.companyName}</td>
                        <td style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                          {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td>
                          <span className={`badge ${statusConfig.cls}`}>{statusConfig.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
