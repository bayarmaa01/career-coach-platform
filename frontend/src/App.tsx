import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from './store/store';
import { getCurrentUser } from './store/slices/authSlice';

import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import CareerRecommendations from './pages/CareerRecommendations';
import SkillGapAnalysis from './pages/SkillGapAnalysis';
import AdminPanel from './pages/AdminPanel';
import CreateCVPage from './pages/CreateCVPage';
import CareerChatPage from './pages/CareerChatPage';
import SkillRecommendationsPage from './pages/SkillRecommendationsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isLoading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="resume-upload"
          element={
            <ProtectedRoute>
              <ResumeUpload />
            </ProtectedRoute>
          }
        />
        <Route
          path="career-recommendations"
          element={
            <ProtectedRoute>
              <CareerRecommendations />
            </ProtectedRoute>
          }
        />
        <Route
          path="skill-gap-analysis"
          element={
            <ProtectedRoute>
              <SkillGapAnalysis />
            </ProtectedRoute>
          }
        />
        <Route
          path="create-cv"
          element={
            <ProtectedRoute>
              <CreateCVPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="career-chat"
          element={
            <ProtectedRoute>
              <CareerChatPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="skill-recommendations"
          element={
            <ProtectedRoute>
              <SkillRecommendationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
