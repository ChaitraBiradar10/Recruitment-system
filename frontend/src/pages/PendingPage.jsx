import React from 'react';
import { useNavigate } from 'react-router-dom';
export default function PendingPage() {
  const navigate = useNavigate();
  return (
    <div className="pending-page">
      <div className="pending-card">
        <div style={{width:68,height:68,borderRadius:'50%',background:'var(--warning-bg)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px'}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="#b07a10"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
        </div>
        <h2 style={{marginBottom:12}}>Registration Submitted!</h2>
        <p style={{fontSize:14,color:'var(--gray-400)',lineHeight:1.75,marginBottom:20}}>Your registration is pending admin approval. You will receive an email at your college address once reviewed.</p>
        <div className="alert alert-warning" style={{textAlign:'left',marginBottom:24}}>
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          <span>Approval time: <strong>1–2 business days</strong></span>
        </div>
        <button className="btn btn-primary btn-full" onClick={()=>navigate('/login')}>Back to Login</button>
      </div>
    </div>
  );
}
