import React, { useEffect, useState } from 'react';
import { jobService } from '../../services/api';

const APP_STATUS = {
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
    return APP_STATUS[app.status];
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
    return APP_STATUS.APTITUDE_SCHEDULED;
  }

  return APP_STATUS[app?.status] || { label: app?.status, cls: 'badge-pending' };
};

const getRoundBadgeConfig = round => {
  if (round?.status === 'SCHEDULED') {
    return { label: 'Scheduled', background: 'var(--warning)' };
  }

  if (round?.status === 'COMPLETED') {
    if ((round?.result || '').toUpperCase() === 'PASS') {
      return {
        label: isAptitudeRound(round?.roundType) ? 'Cleared' : 'Passed',
        background: 'var(--success)',
      };
    }

    if ((round?.result || '').toUpperCase() === 'FAIL') {
      return { label: 'Failed', background: 'var(--danger)' };
    }

    return { label: 'Completed', background: 'var(--success)' };
  }

  return { label: round?.status || 'Pending', background: 'var(--gray-300)' };
};

const formatDisplayDate = value => {
  if (!value) return '--';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatDisplayTime = value => {
  if (!value) return '--';
  const parsed = new Date(`2000-01-01T${value}`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};

const getApplicationMeta = selected => ([
  selected.aptitudeScore != null && [
    'Aptitude Score',
    `${selected.aptitudeScore} / ${selected.aptitudeCleared ? 'Cleared' : 'Failed'}`,
  ],
  selected.interviewDate && ['Interview Date', formatDisplayDate(selected.interviewDate)],
  selected.interviewTime && ['Interview Time', formatDisplayTime(selected.interviewTime)],
  selected.interviewMode && ['Interview Mode', selected.interviewMode],
  selected.interviewResult && ['Interview Result', selected.interviewResult],
  selected.finalSelected != null && ['Final Decision', selected.finalSelected ? 'Selected' : 'Not selected'],
].filter(Boolean));

export default function StudentApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [roundsData, setRoundsData] = useState(null);
  const [loadingRounds, setLoadingRounds] = useState(false);

  useEffect(() => {
    jobService.getMyApplications()
      .then(response => setApps(response.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const closeDetails = () => {
    setSelected(null);
    setRoundsData(null);
  };

  const handleSelectApplication = async app => {
    if (selected?.id === app.id) {
      closeDetails();
      return;
    }

    setSelected(app);
    setRoundsData(null);
    setLoadingRounds(true);

    try {
      const response = await jobService.getRoundScheduling(app.id);
      setRoundsData(response.data);
    } catch (error) {
      console.error('Failed to load rounds:', error);
      setRoundsData({ rounds: [] });
    } finally {
      setLoadingRounds(false);
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">My Applications</div>
          <div className="topbar-sub">Track your job applications and round status</div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--gray-400)' }}>
          {apps.length} application{apps.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="page-content">
        {loading && (
          <div className="spinner-wrap">
            <div className="spinner" />
          </div>
        )}

        {!loading && apps.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>
            No applications yet. Browse jobs and start applying!
          </div>
        )}

        <div className="student-applications-layout">
          <div>
            {apps.map(app => {
              const statusConfig = getStatusConfig(app);
              const currentRoundLabel = isAptitudeRound(app.currentRoundType) ? 'Aptitude' : 'Interview';

              return (
                <div
                  key={app.id}
                  className="job-card"
                  onClick={() => handleSelectApplication(app)}
                  style={{
                    cursor: 'pointer',
                    border: selected?.id === app.id ? '2px solid var(--navy)' : '1px solid var(--gray-100)',
                  }}
                >
                  <div className="job-card-header">
                    <div>
                      <div className="job-card-title">{app.jobTitle}</div>
                      <div className="job-card-company">{app.companyName}</div>
                    </div>
                    <span className={`badge ${statusConfig.cls}`}>{statusConfig.label}</span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 8 }}>
                    Applied: {new Date(app.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>

                  {app.interviewDate && (
                    <div style={{ fontSize: 13, color: 'var(--navy)', marginTop: 6, fontWeight: 500 }}>
                      {currentRoundLabel}: {app.interviewDate} at {app.interviewTime} ({app.interviewMode})
                    </div>
                  )}

                  {app.currentRoundDisplayStatus && (
                    <div style={{ fontSize: 13, color: 'var(--text-mid)', marginTop: 6 }}>
                      {app.currentRoundDisplayStatus}
                    </div>
                  )}

                  {app.status === 'SELECTED' && (
                    <div className="alert alert-success" style={{ marginTop: 10, marginBottom: 0 }}>
                      Congratulations! You have been selected for this position.
                    </div>
                  )}

                  {statusConfig.label === APP_STATUS.APTITUDE_SCHEDULED.label && (
                    <div className="alert alert-warning" style={{ marginTop: 10, marginBottom: 0 }}>
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                      </svg>
                      Aptitude round scheduled. Please check your email for details.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="modal-overlay" onClick={closeDetails}>
            <div className="modal student-application-modal" onClick={event => event.stopPropagation()}>
              <div className="student-application-detail-head">
                <div>
                  <div className="student-application-detail-title">{selected.jobTitle}</div>
                  <div className="student-application-detail-company">{selected.companyName}</div>
                </div>
                <button
                  type="button"
                  className="student-application-close"
                  onClick={closeDetails}
                  aria-label="Close application details"
                >
                  x
                </button>
              </div>

              <div className="student-application-modal-body">
                <div className="student-application-overview">
                  <div className="student-application-overview-top">
                    <span className={`badge ${getStatusConfig(selected).cls}`}>{getStatusConfig(selected).label}</span>
                    <span className="student-application-overview-sub">
                      Applied on {new Date(selected.appliedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  {selected.currentRoundDisplayStatus && (
                    <div className="student-application-highlight">
                      <div className="student-application-highlight-label">Current Progress</div>
                      <div className="student-application-highlight-value">{selected.currentRoundDisplayStatus}</div>
                    </div>
                  )}

                  <div className="student-application-meta-grid">
                    {getApplicationMeta(selected).map(([key, value]) => (
                      <div key={key} className="student-application-meta-card">
                        <div className="student-application-meta-label">{key}</div>
                        <div className="student-application-meta-value">{value}</div>
                      </div>
                    ))}
                  </div>

                  {selected.interviewNotes && (
                    <div className="student-application-notes">
                      <div className="student-application-notes-label">Notes</div>
                      <div className="student-application-notes-body">{selected.interviewNotes}</div>
                    </div>
                  )}
                </div>

                {loadingRounds && (
                  <div style={{ textAlign: 'center', padding: 20, color: 'var(--gray-400)' }}>
                    Loading rounds...
                  </div>
                )}

                {roundsData?.rounds?.length > 0 && (
                  <div className="student-rounds-section">
                    <div className="student-rounds-title">
                      Selection Rounds ({roundsData.rounds.length})
                    </div>

                    <div className="student-rounds-list">
                      {roundsData.rounds.map(round => (
                        <div key={round.id} className="student-round-card">
                          <div className="student-round-marker">
                            <span>{round.roundNumber}</span>
                          </div>

                          <div className="student-round-content">
                            <div className="student-round-top">
                              <div>
                                <div className="student-round-kicker">Round {round.roundNumber}</div>
                                <div className="student-round-name">{round.roundType}</div>
                              </div>
                              <div
                                className="student-round-badge"
                                style={{ background: getRoundBadgeConfig(round).background }}
                              >
                                {getRoundBadgeConfig(round).label}
                              </div>
                            </div>

                            <div className="student-round-meta-row">
                              <div className="student-round-meta-pill">
                                {formatDisplayDate(round.scheduledDate)} at {formatDisplayTime(round.scheduledTime)}
                              </div>
                              <div className="student-round-meta-pill">
                                {round.interviewMode || 'Mode pending'}
                              </div>
                              <div className="student-round-meta-pill">
                                {round.location || 'Location pending'}
                              </div>
                            </div>

                            {round.description && (
                              <div className="student-round-description">{round.description}</div>
                            )}

                            {round.status === 'COMPLETED' && (
                              <div className="student-round-result-box">
                                <div className="student-round-result-grid">
                                  <div>
                                    <div className="student-round-result-label">Result</div>
                                    <div className="student-round-result-value">{round.result || '--'}</div>
                                  </div>
                                  {round.score != null && (
                                    <div>
                                      <div className="student-round-result-label">Score</div>
                                      <div className="student-round-result-value">{round.score}</div>
                                    </div>
                                  )}
                                </div>

                                {round.notes && (
                                  <div className="student-round-feedback">
                                    <strong>Notes:</strong> {round.notes}
                                  </div>
                                )}

                                {round.feedback && (
                                  <div className="student-round-feedback">
                                    <strong>Feedback:</strong> {round.feedback}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!loadingRounds && roundsData?.rounds?.length === 0 && (
                  <div className="student-rounds-empty">
                    No round details have been published for this application yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
