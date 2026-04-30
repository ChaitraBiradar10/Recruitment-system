import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin',                 label: 'Overview',           end: true,  icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/></svg> },
  { to: '/admin/registrations',   label: 'Registrations',      end: false, icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg> },
  { to: '/admin/jobs',            label: 'Manage Jobs',        end: false, icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-2.18c.07-.44.18-.88.18-1.36C18 2.1 15.9 0 13.36 0c-1.3 0-2.43.52-3.29 1.35L9 2.4 7.93 1.35C7.07.52 5.94 0 4.64 0 2.1 0 0 2.1 0 4.64c0 .48.11.92.18 1.36H0v2h20v-2zM22 8H2v12a2 2 0 002 2h16a2 2 0 002-2V8z"/></svg> },
  { to: '/admin/selected-students', label: 'Selected Students',  end: false, icon: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg> },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); toast.success('Logged out.'); navigate('/login'); };

  return (
    <div className="app-layout">
      <aside className="sidebar" style={{ background: '#0a1520' }}>
        <div className="sidebar-logo">
          <h2>Admin Panel</h2>
          <p>GIT PLACEMENT OFFICE</p>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {n.icon}{n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="avatar avatar-gold">AD</div>
            <div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 500 }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>Placement Officer</div>
            </div>
          </div>
          <button className="sidebar-signout" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
