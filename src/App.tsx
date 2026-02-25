import React, { ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminPage from './pages/AdminPage';
import StudentPage from './pages/StudentPage';
import QuizPage from './pages/QuizPage';
import SummaryPage from './pages/SummaryPage';
import { useAuth } from './hooks/useAuth';

function ProtectedRoute({ children, role }: { children: ReactNode; role?: 'admin' | 'student' }) {
  const { user, token } = useAuth();
  
  if (!token) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} />;
  
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <AdminPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/student" 
          element={
            <ProtectedRoute role="student">
              <StudentPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/quiz/:id" 
          element={
            <ProtectedRoute role="student">
              <QuizPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/summary/:id" 
          element={
            <ProtectedRoute role="student">
              <SummaryPage />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
