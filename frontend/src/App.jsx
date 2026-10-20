import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import HomePage from './pages/HomePage';
import InvitePage from './pages/InvitePage';

function App() {
  const { user } = useAuth();

  return (
    // Set global background and text color
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <HomePage />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
        <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/" />} />
        <Route path="/project/:projectId" element={user ? <ProjectPage /> : <Navigate to="/" />} />
        <Route path="/invite/:token" element={<InvitePage />} />
      </Routes>
    </div>
  );
}

export default App;
