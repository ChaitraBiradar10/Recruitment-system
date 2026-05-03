import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/api';

const ROUND_TYPES = [
  'Aptitude Round',
  'Group Discussion',
  'Coding Round',
  'Technical Interview',
  'Managerial Round',
  'HR Round',
];

const EMPTY_SCHEDULE = roundNumber => ({
  roundNumber,
  roundType: ROUND_TYPES[0],
  scheduledDate: '',
  scheduledTime: '',
  location: '',
  interviewMode: 'Online',
  description: '',
});

const EMPTY_RESULT = {
  result: 'PASS',
  score: '',
  notes: '',
};

const EMPTY_FINAL_DECISION = {
  finalSelected: 'true',
  notes: '',
};

const ROUND_LOCATION_REGEX = /^[A-Za-z0-9 .,#:/()-]+$/;
const ROUND_DESCRIPTION_REGEX = /^[A-Za-z0-9 .,;:()'"\/&+-]+$/;
const HAS_LETTER_REGEX = /[A-Za-z]/;

const getRoundDateTime = round => {
  if (!round?.scheduledDate || !round?.scheduledTime) return null;
  const value = new Date(`${round.scheduledDate}T${round.scheduledTime}`);
  return Number.isNaN(value.getTime()) ? null : value;
};

const hasRoundTimePassed = (round, now) => {
  const scheduledAt = getRoundDateTime(round);
  return scheduledAt ? scheduledAt <= now : false;
};

const formatRoundSchedule = round => {
  const scheduledAt = getRoundDateTime(round);
  if (!scheduledAt) return null;

  return scheduledAt.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

const toSchedulingState = round => ({
  roundNumber: round?.roundNumber || 1,
  roundType: round?.roundType || ROUND_TYPES[0],
  scheduledDate: round?.scheduledDate || '',
  scheduledTime: round?.scheduledTime || '',
  location: round?.location || '',
  interviewMode: round?.interviewMode || 'Online',
  description: round?.description || '',
});

export default function AdminRoundScheduling({ appId, onBack }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedRound, setSelectedRound] = useState(null);
  const [showFinalDecision, setShowFinalDecision] = useState(false);
  const [showSchedulingForm, setShowSchedulingForm] = useState(false);
  const [scheduling, setScheduling] = useState(EMPTY_SCHEDULE(1));
  const [result, setResult] = useState(EMPTY_RESULT);
  const [finalDecision, setFinalDecision] = useState(EMPTY_FINAL_DECISION);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: viewData } = await adminService.getRoundScheduling(appId);
      setData(viewData);
      const nextRound = viewData.rounds.length + 1;
      setScheduling(prev => ({ ...EMPTY_SCHEDULE(nextRound), roundType: prev.roundType || ROUND_TYPES[0] }));
      setShowSchedulingForm(false);
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to load round data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [appId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const isClosed = ['SELECTED', 'REJECTED'].includes(data?.jobApplicationStatus);
  const latestRound = data?.rounds?.length ? data.rounds[data.rounds.length - 1] : null;
  const latestRoundResult = latestRound?.result?.toUpperCase?.() || '';
  const nextRoundNumber = (data?.rounds?.length || 0) + 1;
  const currentScheduledRound = data?.rounds?.filter(round => round.status === 'SCHEDULED').slice(-1)[0] || null;
  const waitingForCurrentRound = currentScheduledRound && !hasRoundTimePassed(currentScheduledRound, now);
  const hasPendingScheduledRound = Boolean(currentScheduledRound);
  const isEditingScheduledRound = Boolean(currentScheduledRound) && scheduling.roundNumber === currentScheduledRound?.roundNumber;
  const canScheduleAnotherRound = data
    && !isClosed
    && !hasPendingScheduledRound
    && (data.rounds.length === 0 || (latestRound?.status === 'COMPLETED' && latestRoundResult === 'PASS'));
  const canGoForFinalDecision = data
    && !isClosed
    && data.rounds.length > 0
    && latestRound?.status === 'COMPLETED'
    && latestRoundResult === 'PASS'
    && !hasPendingScheduledRound;
  const canRescheduleCurrentRound = data && !isClosed && Boolean(currentScheduledRound);
  const canShowSchedulingForm = data && !isClosed && (!hasPendingScheduledRound || isEditingScheduledRound);
  const currentStatusLabel = (() => {
    if (currentScheduledRound) {
      return `${currentScheduledRound.roundType || `Round ${currentScheduledRound.roundNumber}`} Scheduled`;
    }
    if (data?.jobApplicationStatus === 'SELECTED') return 'Selected';
    if (data?.jobApplicationStatus === 'REJECTED') return 'Rejected';
    if (latestRound?.status === 'COMPLETED') {
      return `${latestRound.roundType || `Round ${latestRound.roundNumber}`} Completed`;
    }
    return 'No Round Scheduled';
  })();
  const currentStatusTime = currentScheduledRound ? formatRoundSchedule(currentScheduledRound) : null;

  const submitRoundSchedule = async rescheduleExisting => {
    await adminService.scheduleRound(appId, {
      ...scheduling,
      location: scheduling.location.trim(),
      description: scheduling.description.trim(),
      rescheduleExisting,
    });
    toast.success(rescheduleExisting ? `Round ${scheduling.roundNumber} rescheduled.` : `Round ${scheduling.roundNumber} scheduled.`);
    setScheduling(EMPTY_SCHEDULE(scheduling.roundNumber + 1));
    setShowSchedulingForm(false);
    await fetchData();
  };

  const openNewRoundForm = () => {
    setScheduling(EMPTY_SCHEDULE(nextRoundNumber));
    setShowFinalDecision(false);
    setFinalDecision(EMPTY_FINAL_DECISION);
    setShowSchedulingForm(true);
  };

  const openRescheduleForm = () => {
    if (!currentScheduledRound) return;
    setScheduling(toSchedulingState(currentScheduledRound));
    setShowFinalDecision(false);
    setFinalDecision(EMPTY_FINAL_DECISION);
    setShowSchedulingForm(true);
  };

  const openFinalDecisionModal = () => {
    setShowSchedulingForm(false);
    setSelectedRound(null);
    setFinalDecision(EMPTY_FINAL_DECISION);
    setShowFinalDecision(true);
  };

  const closeFinalDecisionModal = () => {
    setShowFinalDecision(false);
    setFinalDecision(EMPTY_FINAL_DECISION);
  };

  const handleScheduleRound = async event => {
    event.preventDefault();
    if (!scheduling.scheduledDate || !scheduling.scheduledTime || !scheduling.location.trim() || !scheduling.description.trim()) {
      toast.error('Please fill round type, date, time, place, and description.');
      return;
    }

    const scheduledAt = getRoundDateTime(scheduling);
    if (!scheduledAt) {
      toast.error('Please enter a valid round date and time.');
      return;
    }
    if (scheduledAt <= new Date()) {
      toast.error('Past time is not allowed. Please choose a future round date and time.');
      return;
    }
    if (!ROUND_LOCATION_REGEX.test(scheduling.location.trim())) {
      toast.error('Place / Location can contain letters, numbers, spaces, and basic punctuation.');
      return;
    }
    if (!HAS_LETTER_REGEX.test(scheduling.location.trim())) {
      toast.error('Place / Location cannot contain only numbers.');
      return;
    }
    if (!ROUND_DESCRIPTION_REGEX.test(scheduling.description.trim())) {
      toast.error('Round description can contain letters, numbers, spaces, and basic punctuation.');
      return;
    }
    if (!HAS_LETTER_REGEX.test(scheduling.description.trim())) {
      toast.error('Round description cannot contain only numbers.');
      return;
    }

    setSaving(true);
    try {
      await submitRoundSchedule(false);
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.message || 'Failed to schedule round.';
      if (message.toLowerCase().includes('already scheduled')) {
        const shouldReschedule = window.confirm(message);
        if (shouldReschedule) {
          try {
            await submitRoundSchedule(true);
          } catch (retryError) {
            console.error(retryError);
            toast.error(retryError.response?.data?.message || 'Failed to reschedule round.');
          }
        }
      } else {
        toast.error(message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRecordResult = async event => {
    event.preventDefault();
    if (!selectedRound) return;

    setSaving(true);
      try {
        await adminService.recordRoundResult(appId, selectedRound.id, {
          ...result,
          score: result.score === '' ? null : parseInt(result.score, 10),
        });
        toast.success('Round result recorded.');
        setSelectedRound(null);
        setResult(EMPTY_RESULT);
        await fetchData();
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || 'Failed to record result.');
    } finally {
      setSaving(false);
    }
  };

  const handleFinalDecision = async event => {
    event.preventDefault();
    setSaving(true);
    try {
      await adminService.finalDecision(appId, {
        finalSelected: finalDecision.finalSelected === 'true',
        notes: finalDecision.notes.trim(),
      });
      toast.success('Final decision recorded.');
      closeFinalDecisionModal();
      onBack();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to record final decision.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)' }}>Loading round data...</div>;
  }

  if (!data) {
    return <div style={{ padding: 20, textAlign: 'center', color: 'var(--gray-400)' }}>No round data available.</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid var(--gray-200)',
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Round Scheduling</h3>
          <p style={{ margin: '4px 0 0 0', fontSize: 13, color: 'var(--gray-400)' }}>
            {data.studentName} - {data.jobTitle}
          </p>
          <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--gray-400)' }}>
            Current application status: {currentStatusLabel}
          </p>
          {currentStatusTime && (
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: 'var(--gray-400)' }}>
              Scheduled for: {currentStatusTime}
            </p>
          )}
        </div>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--gray-400)', cursor: 'pointer' }}
        >
          x
        </button>
      </div>

      {data.rounds.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {data.rounds.map(round => {
            const isPastTime = hasRoundTimePassed(round, now);
            const background =
              round.status === 'COMPLETED'
                ? 'var(--success)'
                : round.status === 'SCHEDULED'
                  ? 'var(--warning)'
                  : 'var(--gray-400)';

            return (
              <div
                key={round.id}
                style={{
                  padding: 14,
                  background,
                  color: 'white',
                  borderRadius: 8,
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: round.status === 'SCHEDULED' && isPastTime ? 'pointer' : 'default',
                }}
                onClick={() => round.status === 'SCHEDULED' && isPastTime && setSelectedRound(round)}
              >
                Round {round.roundNumber}
                <br />
                <span style={{ fontSize: 11, opacity: 0.85 }}>{round.status}</span>
              </div>
            );
          })}
        </div>
      )}

      {data.rounds.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {data.rounds.map(round => (
            <div
              key={round.id}
              style={{
                padding: 16,
                background: 'var(--gray-50)',
                borderRadius: 8,
                border: '1px solid var(--gray-200)',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
                Round {round.roundNumber} - {round.roundType}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 4 }}>
                Date: {round.scheduledDate || '--'} | Time: {round.scheduledTime || '--'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 4 }}>
                Mode: {round.interviewMode || '--'} | Place: {round.location || '--'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-mid)', marginBottom: 8 }}>
                {round.description || '--'}
              </div>
              <div
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  background: round.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)',
                  color: 'white',
                  marginBottom: 8,
                }}
              >
                {round.status}
              </div>
              {round.status === 'COMPLETED' && (
                <div style={{ fontSize: 12, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--gray-200)' }}>
                  <div><strong>Result:</strong> {round.result}</div>
                  <div><strong>Score:</strong> {round.score ?? '--'}</div>
                  {round.notes && <div style={{ marginTop: 4 }}><strong>Notes:</strong> {round.notes}</div>}
                </div>
              )}
              {round.status === 'SCHEDULED' && hasRoundTimePassed(round, now) && (
                <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => setSelectedRound(round)}>
                  Record Result
                </button>
              )}
              {round.status === 'SCHEDULED' && !hasRoundTimePassed(round, now) && (
                <div style={{ marginTop: 8, fontSize: 12, color: 'var(--gray-500)' }}>
                  Result will be available after {formatRoundSchedule(round)}.
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isClosed && (
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          {canScheduleAnotherRound && (
            <button
              className="btn btn-primary"
              onClick={openNewRoundForm}
            >
              {data.rounds.length === 0 ? 'Schedule Round 1' : 'Schedule Next Round'}
            </button>
          )}
          {canRescheduleCurrentRound && (
            <button className="btn btn-outline" onClick={openRescheduleForm}>
              Reschedule Current Round
            </button>
          )}
          {canGoForFinalDecision && (
            <button className="btn btn-gold" onClick={openFinalDecisionModal}>
              Go For Final Decision
            </button>
          )}
        </div>
      )}

      {canShowSchedulingForm && showSchedulingForm ? (
        <div
          style={{
            padding: 16,
            background: 'var(--gray-50)',
            borderRadius: 8,
            border: '1px solid var(--gray-200)',
            marginBottom: 24,
          }}
        >
          <h4 style={{ margin: '0 0 16px 0', color: 'var(--text)' }}>
            {isEditingScheduledRound ? `Reschedule Round ${scheduling.roundNumber}` : `Schedule Round ${scheduling.roundNumber}`}
          </h4>
          <form onSubmit={handleScheduleRound}>
            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Round</label>
                <select value={scheduling.roundType} onChange={event => setScheduling(prev => ({ ...prev, roundType: event.target.value }))}>
                  {ROUND_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Mode</label>
                 <select value={scheduling.interviewMode} onChange={event => setScheduling(prev => ({ ...prev, interviewMode: event.target.value }))}>
                   <option>Online</option>
                   <option>In-person</option>
                 </select>
               </div>
            </div>

            <div className="form-row" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Date</label>
                <input type="date" required value={scheduling.scheduledDate} onChange={event => setScheduling(prev => ({ ...prev, scheduledDate: event.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Time</label>
                <input type="time" required value={scheduling.scheduledTime} onChange={event => setScheduling(prev => ({ ...prev, scheduledTime: event.target.value }))} />
              </div>
            </div>

            <div className="form-group">
              <label>Place / Location</label>
              <input type="text" required placeholder="Meeting room, lab, board room, or online link note" value={scheduling.location} onChange={event => setScheduling(prev => ({ ...prev, location: event.target.value }))} />
              <div className="form-hint">Examples: Online, Google Meet, Seminar Hall, Room 101, or Lab 2.</div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} required placeholder="Tell the student what this round is about." value={scheduling.description} onChange={event => setScheduling(prev => ({ ...prev, description: event.target.value }))} />
            </div>

            <div className="btn-row">
              <button type="button" className="btn btn-outline" onClick={() => setShowSchedulingForm(false)} disabled={saving}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? (isEditingScheduledRound ? 'Rescheduling...' : 'Scheduling...') : (isEditingScheduledRound ? 'Save Reschedule' : 'Schedule Round')}
              </button>
            </div>
          </form>
        </div>
      ) : !isClosed && !showSchedulingForm && data.rounds.length === 0 ? (
        <div className="alert alert-info">
          Click the schedule button to open round fields.
        </div>
      ) : !isClosed && waitingForCurrentRound ? (
        <div className="alert alert-info">
          Final decision stays locked until the scheduled round time has passed and its result is recorded.
        </div>
      ) : !isClosed && latestRound?.status === 'COMPLETED' && latestRoundResult === 'PASS' && canGoForFinalDecision && canScheduleAnotherRound ? (
        <div className="alert alert-success">
          The latest round has passed. You can now schedule the next round or record the final decision.
        </div>
      ) : !isClosed && latestRound?.status === 'COMPLETED' && latestRoundResult === 'PASS' && canGoForFinalDecision ? (
        <div className="alert alert-success">
          You can now record the final decision.
        </div>
      ) : !isClosed && latestRound?.status === 'COMPLETED' && latestRoundResult === 'PASS' && canScheduleAnotherRound ? (
        <div className="alert alert-success">
          The latest round has passed. You can now schedule the next round.
        </div>
      ) : !isClosed && latestRound?.status === 'COMPLETED' && latestRoundResult === 'FAIL' ? (
        <div className="alert alert-danger">
          This application was rejected after the latest round result.
        </div>
      ) : (
        <div className={`alert ${data.jobApplicationStatus === 'SELECTED' ? 'alert-success' : 'alert-danger'}`}>
          This application is already {data.jobApplicationStatus.toLowerCase()}.
        </div>
      )}

      {selectedRound && selectedRound.status === 'SCHEDULED' && (
        <div className="modal-overlay" onClick={() => setSelectedRound(null)}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <h3 className="modal-title">Record Result - Round {selectedRound.roundNumber}</h3>
            <form onSubmit={handleRecordResult}>
              <div className="form-group">
                <label>Result</label>
                <select value={result.result} onChange={event => setResult(prev => ({ ...prev, result: event.target.value }))}>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                </select>
              </div>
              <div className="form-group">
                <label>Score</label>
                <input type="number" min="0" max="100" value={result.score} onChange={event => setResult(prev => ({ ...prev, score: event.target.value }))} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} placeholder="Internal notes..." value={result.notes} onChange={event => setResult(prev => ({ ...prev, notes: event.target.value }))} />
              </div>
              <div className="btn-row">
                <button type="button" className="btn btn-outline" onClick={() => setSelectedRound(null)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Saving...' : 'Submit Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFinalDecision && (
        <div className="modal-overlay" onClick={closeFinalDecisionModal}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <h3 className="modal-title">Final Decision</h3>
            <form onSubmit={handleFinalDecision}>
              <div className="form-group">
                <label>Decision</label>
                <select value={finalDecision.finalSelected} onChange={event => setFinalDecision(prev => ({ ...prev, finalSelected: event.target.value }))}>
                  <option value="true">Select Candidate</option>
                  <option value="false">Reject Candidate</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea rows={3} placeholder="Final remarks or summary..." value={finalDecision.notes} onChange={event => setFinalDecision(prev => ({ ...prev, notes: event.target.value }))} />
              </div>
              <div className="btn-row">
                <button type="button" className="btn btn-outline" onClick={closeFinalDecisionModal}>Cancel</button>
                <button type="submit" className="btn btn-gold" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Final Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
