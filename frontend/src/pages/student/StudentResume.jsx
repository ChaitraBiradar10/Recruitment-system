import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { studentService } from '../../services/api';

function fmtBytes(b) {
  if (!b) return '';
  return b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;
}

export default function StudentResume() {
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    studentService.getProfile().then(r => setProfile(r.data)).catch(() => {});
  }, []);

  const handleFile = async file => {
    if (!file) return;
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.type)) return toast.error('Only PDF and DOCX are accepted.');
    if (file.size > 5 * 1024 * 1024) return toast.error('Max file size is 5 MB.');
    setUploading(true);
    setProgress(0);
    try {
      const { data } = await studentService.uploadResume(file, setProgress);
      toast.success('CV uploaded successfully!');
      setProfile(p => ({ ...p, resume: data.data }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDownload = async () => {
    try {
      const { data } = await studentService.downloadResume();
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = profile.resume.originalFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed.');
    }
  };

  return (
    <>
      <div className="topbar">
        <div>
          <div className="topbar-title">Resume / CV</div>
          <div className="topbar-sub">Upload your latest CV — PDF or DOCX only, max 5 MB</div>
        </div>
      </div>
      <div className="page-content">
        <div className="alert alert-info">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
          <span>Only <strong>PDF</strong> and <strong>DOCX</strong> files are accepted · Maximum <strong>5 MB</strong></span>
        </div>

        <div className="card">
          <div className="card-title">Upload Document</div>
          <div
            className={`upload-zone${dragOver ? ' drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
          >
            <div className="upload-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--gray-400)">
                <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
              </svg>
            </div>
            <p style={{ fontSize: 14, color: 'var(--gray-600)', marginBottom: 4 }}>
              Drag & drop or <span style={{ color: 'var(--navy)', fontWeight: 600 }}>browse files</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>PDF, DOCX only · Max 5 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])}
            />
          </div>

          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--gray-400)', marginBottom: 6 }}>
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          {profile?.resume && !uploading && (
            <div className="file-badge">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--info)">
                <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: 'var(--navy)', marginBottom: 2 }}>
                  {profile.resume.originalFileName}
                </div>
                <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
                  {fmtBytes(profile.resume.fileSize)} · Uploaded {new Date(profile.resume.uploadedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <button className="btn btn-sm btn-outline" onClick={handleDownload}>Download</button>
            </div>
          )}

          <div className="btn-row">
            <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : profile?.resume ? 'Replace CV' : 'Select File'}
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-title">CV Guidelines</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'var(--text-mid)' }}>
            {[
              'Use a clean, professional format — 1 or 2 column layout',
              'Include contact info, education, skills, projects, and internships',
              'Keep to 1–2 pages maximum',
              'Accepted formats: PDF (preferred) or DOCX',
              'Maximum file size: 5 MB',
              'Write in English, free of spelling errors',
            ].map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--gold-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--gold)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                </div>
                {tip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
