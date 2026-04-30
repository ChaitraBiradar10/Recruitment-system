// ── StudentLayout.jsx ─────────────────────────────────────────
import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to:'/student',              label:'Dashboard',    end:true,  icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
  { to:'/student/jobs',         label:'Browse Jobs',  end:false, icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.1 15.9 0 13.36 0c-1.3 0-2.43.52-3.29 1.35L9 2.4 7.93 1.35C7.07.52 5.94 0 4.64 0 2.1 0 0 2.1 0 4.64c0 .48.11.92.18 1.36H0v2h20v-2zm-9.5-.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zM22 8H2v12a2 2 0 002 2h16a2 2 0 002-2V8zm-7 7.5l-3 3-3-3 1.5-1.5 1.5 1.5 1.5-1.5 1.5 1.5z"/></svg> },
  { to:'/student/applications',  label:'My Applications', end:false, icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> },
  { to:'/student/profile',      label:'My Profile',   end:false, icon:<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg> },
];

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initials = user ? (user.firstName?.[0]||'') + (user.lastName?.[0]||'') : 'S';
  const handleLogout = () => { logout(); toast.success('Logged out.'); navigate('/login'); };
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo"><h2>GIT Portal</h2><p>CAMPUS PLACEMENT</p></div>
        <nav className="sidebar-nav">
          {NAV.map(n => <NavLink key={n.to} to={n.to} end={n.end} className={({isActive})=>`nav-item${isActive?' active':''}`}>{n.icon}{n.label}</NavLink>)}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="avatar avatar-gold">{initials.toUpperCase()}</div>
            <div>
              <div style={{color:'rgba(255,255,255,0.85)',fontSize:13,fontWeight:500}}>{user?.firstName} {user?.lastName}</div>
              <div style={{color:'rgba(255,255,255,0.35)',fontSize:11}}>{user?.department||'Student'}</div>
            </div>
          </div>
          <button className="sidebar-signout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
export default StudentLayout;
