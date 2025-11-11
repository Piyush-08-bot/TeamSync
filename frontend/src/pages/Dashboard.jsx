import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import TeamCollaborationComponent from '../components/chat/TeamCollaborationComponent';

const Dashboard = () => {
  const { authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Extract email from authUser if available
    if (authUser?.email) {
      setUserEmail(authUser.email);
    } else if (authUser?.token) {
      // If we only have a token, we could decode it to get user info
      // For now, we'll just show a placeholder
      setUserEmail('Email not available');
    }
  }, [authUser]);

  const handleLogout = async () => {
    await logout();
    navigate('/sign-in');
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="btn-secondary">Sign out</button>
      </header>
      
      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Welcome back, {authUser?.name || 'User'}!</h2>
          <p>You are successfully logged in to TeamSync.</p>
        </div>
        
        <div className="dashboard-content">
          <div className="card">
            <h3>Your Profile</h3>
            <div className="profile-info">
              <p><strong>Name:</strong> {authUser?.name || 'Not available'}</p>
              <p><strong>Email:</strong> {userEmail}</p>
            </div>
          </div>
          
          <div className="card">
            <h3>Team Features</h3>
            <TeamCollaborationComponent />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;