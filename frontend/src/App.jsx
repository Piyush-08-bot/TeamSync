import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { StreamProvider } from './contexts/StreamContext';


import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import OnboardingPage from './pages/OnboardingPage';
import VideoCallPage from './pages/VideoCallPage';


import LoadingSpinner from './components/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { authUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!authUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!authUser.isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

const App = () => {
  const { authUser, isLoading } = useAuth();

  if (isLoading && !authUser) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <StreamProvider>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding"
              element={
                <ProtectedRoute>
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video"
              element={
                <ProtectedRoute>
                  <VideoCallPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/video/:callType/:callId"
              element={
                <ProtectedRoute>
                  <VideoCallPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={!authUser ? <AuthPage /> : <Navigate to="/" />}
            />
            <Route
              path="/signup"
              element={!authUser ? <AuthPage /> : <Navigate to="/" />}
            />
          </Routes>
        </StreamProvider>
      </div>
    </BrowserRouter>
  );
};

export default App;