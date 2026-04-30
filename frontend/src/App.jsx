import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PendingPage from './pages/PendingPage';

import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentJobs from './pages/student/StudentJobs';
import StudentApplications from './pages/student/StudentApplications';

import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRegistrations from './pages/admin/AdminRegistrations';
import AdminJobs from './pages/admin/AdminJobs';
import AdminJobApplicants from './pages/admin/AdminJobApplicants';
import AdminSelectedStudents from './pages/admin/AdminSelectedStudents';


// 🔐 Route protection component
function Guard({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-wrap">
        <div className="spinner" />
      </div>
    );
  }

  // If not logged in → go to login page
  if (!user) return <Navigate to="/login" replace />;

  // If role mismatch → go to login page
  if (role && user.role !== role) return <Navigate to="/login" replace />;

  return children;
}


// 🌐 App Routes
function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>

      {/* ✅ ALWAYS start from Home page */}
      <Route path="/" element={<HomePage />} />

      {/* Login page redirect if already logged in */}
      <Route 
        path="/login" 
        element={
          user 
            ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} replace /> 
            : <LoginPage />
        } 
      />

      <Route path="/register" element={<LoginPage />} />
      <Route path="/pending" element={<PendingPage />} />

      {/* 👨‍🎓 Student routes */}
      <Route path="/student" element={<Guard role="STUDENT"><StudentLayout /></Guard>}>
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfile />} />
        <Route path="jobs" element={<StudentJobs />} />
        <Route path="applications" element={<StudentApplications />} />
      </Route>

      {/* 👨‍💼 Admin routes */}
      <Route path="/admin" element={<Guard role="ADMIN"><AdminLayout /></Guard>}>
        <Route index element={<AdminDashboard />} />
        <Route path="registrations" element={<AdminRegistrations />} />
        <Route path="jobs" element={<AdminJobs />} />
        <Route path="jobs/:id/applicants" element={<AdminJobApplicants />} />
        <Route path="selected-students" element={<AdminSelectedStudents />} />
      </Route>

      {/* Unknown routes → go home */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}


// 🚀 Main App
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '14px',
              borderRadius: '10px',
              boxShadow: '0 8px 32px rgba(15,27,45,0.15)'
            },
            success: { iconTheme: { primary: '#2d6a4f', secondary: '#d8f3dc' } },
            error:   { iconTheme: { primary: '#7c1c1c', secondary: '#ffe0e0' } },
          }}
        />

      </BrowserRouter>
    </AuthProvider>
  );
}