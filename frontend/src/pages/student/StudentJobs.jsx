import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { jobService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const APP_STATUS_LABELS = {
  APPLIED:             'Applied',
  APTITUDE_SCHEDULED:  'Aptitude Scheduled',
  APTITUDE_CLEARED:    'Aptitude Cleared',
  APTITUDE_FAILED:     'Aptitude Failed',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  SELECTED:            '🎉 Selected!',
  REJECTED:            'Not Selected',
};

const getAppliedBadgeClass = job => {
  if (job.myApplicationStatus === 'SELECTED') return 'badge-selected';
  if (job.myApplicationStatus === 'REJECTED') return 'badge-rejected';
  return 'badge-applied';
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

const getDeptAbbr = (department) => {
  // Immediately return null if no department
  if (!department || typeof department !== 'string') {
    return null;
  }
  
  try {
    const normalizedDept = department.trim().toLowerCase();
    if (!normalizedDept) return null;
    
    // Try matching against full names
    const fullMatch = Object.entries(DEPT_ABBR).find(([key]) => key.toLowerCase() === normalizedDept)?.[1];
    if (fullMatch) return fullMatch;
    
    // Try matching against abbreviations
    const abbrevMatch = Object.entries(DEPT_ABBR).find(([_, abbr]) => abbr.toLowerCase() === normalizedDept)?.[1];
    if (abbrevMatch) return abbrevMatch;
    
    // Try partial matching as fallback
    const partialMatch = Object.entries(DEPT_ABBR).find(([key]) => key.toLowerCase().includes(normalizedDept) || normalizedDept.includes(key.toLowerCase()))?.[1];
    if (partialMatch) return partialMatch;
    
    return null;
  } catch (err) {
    console.error('Error in getDeptAbbr:', err);
    return null;
  }
};

const splitCsv = value =>
  (value || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);

export default function StudentJobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [applying, setApplying] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchJobs = () => {
    setLoading(true);
    jobService.getActiveJobs()
      .then(r => setJobs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };
  useEffect(fetchJobs, []);

  // Check if student meets job requirements
  const meetsRequirements = (job) => {
    if (!user) return false;
    
    // If profile not loaded yet, assume they might be eligible (show job)
    // Error will show when they try to apply
    if (!user.department || !user.skills || !user.batchYear) return true;

    const eligibleBatches = splitCsv(job.eligibleBatches);
    if (eligibleBatches.length > 0 && !eligibleBatches.includes(String(user.batchYear).trim())) {
      return false;
    }

    // Check department match
    const studentDeptAbbr = getDeptAbbr(user.department);
    if (!studentDeptAbbr) return false;
    
    const jobDepts = splitCsv(job.eligibleBranches).map(d => d.toUpperCase());
    const deptMatches = jobDepts.includes(studentDeptAbbr.toUpperCase());
    if (!deptMatches) return false;

    // Check skill match (at least 3 skills)
    const studentSkills = splitCsv(user.skills).map(s => s.toLowerCase());
    const jobSkills = splitCsv(job.skills).map(s => s.toLowerCase());
    const matchingSkills = studentSkills.filter(skill => jobSkills.includes(skill));
    
    return matchingSkills.length >= 3;
  };

  const getErrorMessage = (job) => {
    if (!user) return 'Please login to apply';
        // If profile not loaded, show generic message
    if (!user.department || !user.skills || !user.batchYear) {
      return 'Please complete your profile to check eligibility.';
    }
    const eligibleBatches = splitCsv(job.eligibleBatches);
    if (eligibleBatches.length > 0 && !eligibleBatches.includes(String(user.batchYear).trim())) {
      return `This position is only open to batch ${job.eligibleBatches}.`;
    }
        const studentDeptAbbr = getDeptAbbr(user.department);
    if (!studentDeptAbbr) return 'Department not recognized';
    
    const jobDepts = splitCsv(job.eligibleBranches).map(d => d.toUpperCase());
    const deptMatches = jobDepts.includes(studentDeptAbbr.toUpperCase());
    
    if (!deptMatches) {
      return `This position is not available for your department (${studentDeptAbbr})`;
    }

    const studentSkills = splitCsv(user.skills).map(s => s.toLowerCase());
    const jobSkills = splitCsv(job.skills).map(s => s.toLowerCase());
    const matchingSkills = studentSkills.filter(skill => jobSkills.includes(skill));
    
    return `You have ${matchingSkills.length} matching skill(s). At least 3 required skills are needed.`;
  };

  const apply = async job => {
    if (job.alreadyApplied) return;

    const studentBatchYear = String(user?.batchYear || '').trim();
    const eligibleBatches = splitCsv(job.eligibleBatches);
    if (eligibleBatches.length > 0 && !eligibleBatches.includes(studentBatchYear)) {
      toast.error(`This position is only open to batch ${job.eligibleBatches}.`);
      return;
    }
    
    // Validate requirements before applying
    const studentDeptAbbr = getDeptAbbr(user.department);
    if (!studentDeptAbbr) {
      toast.error('Department not set. Please update your profile.');
      return;
    }
    
    const jobDepts = splitCsv(job.eligibleBranches).map(d => d.toUpperCase());
    if (!jobDepts.includes(studentDeptAbbr.toUpperCase())) {
      toast.error(`This position is not available for your department (${studentDeptAbbr}).`);
      return;
    }

    const studentSkills = splitCsv(user.skills).map(s => s.toLowerCase());
    const jobSkills = splitCsv(job.skills).map(s => s.toLowerCase());
    const matchingSkills = studentSkills.filter(skill => jobSkills.includes(skill));
    
    if (matchingSkills.length < 3) {
      toast.error(`You have ${matchingSkills.length} matching skill(s). At least 3 required skills are needed.`);
      return;
    }

    setApplying(job.id);
    try {
      await jobService.applyForJob(job.id);
      toast.success(`Applied for ${job.title} at ${job.companyName}!`);
      fetchJobs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Application failed.');
    } finally {
      setApplying(null);
    }
  };

  const filtered = jobs.filter(j => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return [j.title, j.companyName, j.location, j.jobType, j.skills].join(' ').toLowerCase().includes(q);
  });

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Browse Jobs</div>
          <div className="topbar-sub">{jobs.length} opportunities available</div>
        </div>
      </div>
      <div className="page-content">
        <div className="search-bar">
          <input className="search-input" placeholder="Search by title, company, location, or skills…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading && <div className="spinner-wrap"><div className="spinner" /></div>}
        {!loading && filtered.length === 0 && (
          <div className="card" style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 40 }}>
            No jobs found. Try a different search.
          </div>
        )}

        {filtered.map(job => {
          const isExpanded = expanded === job.id;
          const appliedLabel = job.myCurrentRoundDisplayStatus || APP_STATUS_LABELS[job.myApplicationStatus] || 'Applied';
          const deadlineDate = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
          const isDeadlinePassed = deadlineDate && deadlineDate < new Date();
          const meetsReqs = meetsRequirements(job);
          return (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <div style={{ flex: 1 }}>
                  <div className="job-card-title">{job.title}</div>
                  <div className="job-card-company">
                    🏢 {job.companyName}
                    {job.location && <span> · 📍 {job.location}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  {isDeadlinePassed ? (
                    <span className="badge" style={{ background: 'var(--gray-300)', color: 'var(--text)' }}>
                      Application Closed
                    </span>
                  ) : job.alreadyApplied ? (
                    <span className={`badge ${getAppliedBadgeClass(job)}`}>
                      {appliedLabel}
                    </span>
                  ) : meetsReqs ? (
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={applying === job.id}
                      onClick={() => apply(job)}
                    >
                      {applying === job.id ? 'Applying…' : 'Apply Now'}
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: 'var(--gray-400)', textAlign: 'right' }}>
                      Not eligible
                    </span>
                  )}
                </div>
              </div>

              <div className="job-tags">
                {job.jobType       && <span className="job-tag">💼 {job.jobType}</span>}
                {job.salaryPackage && <span className="job-tag">💰 {job.salaryPackage}</span>}
                {job.minimumCgpa   && <span className="job-tag">📊 Min CGPA: {job.minimumCgpa}</span>}
                {job.totalPositions && <span className="job-tag">🎯 {job.totalPositions} Positions</span>}
                {job.applicationDeadline && (
                  <span className="job-tag">
                    📅 Deadline: {new Date(job.applicationDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                <span className="job-tag">👥 {job.applicantCount} applicants</span>
              </div>

              {!job.alreadyApplied && !isDeadlinePassed && !meetsReqs && user?.department && user?.skills && (
                <div className="alert alert-warning" style={{ marginTop: 10, marginBottom: 0, fontSize: 12 }}>
                  ⚠️ {getErrorMessage(job)}
                </div>
              )}

              {job.description && (
                <p style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 10, lineHeight: 1.65, display: isExpanded ? 'block' : '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {job.description}
                </p>
              )}

              {isExpanded && (
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                  {job.eligibleBranches && <div><span style={{ color: 'var(--gray-400)' }}>Eligible Branches: </span>{job.eligibleBranches}</div>}
                  {job.eligibleBatches && <div><span style={{ color: 'var(--gray-400)' }}>Eligible Batches: </span>{job.eligibleBatches}</div>}
                  {job.skills           && <div><span style={{ color: 'var(--gray-400)' }}>Required Skills: </span>{job.skills}</div>}
                </div>
              )}

              <button
                onClick={() => setExpanded(isExpanded ? null : job.id)}
                style={{ background: 'none', border: 'none', color: 'var(--navy)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 8, padding: 0 }}
              >
                {isExpanded ? '▲ Show less' : '▼ View details'}
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
