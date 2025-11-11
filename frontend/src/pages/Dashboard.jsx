import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { authUser, logout } = useAuth();
  const navigate = useNavigate();

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
          <p>You are successfully logged in to ChatApp.</p>
        </div>
        
        <div className="dashboard-content">
          <div className="card">
            <h3>Your Profile</h3>
            <p>Email: {authUser?.email}</p>
          </div>
          
          <div className="card">
            <h3>Chat Rooms</h3>
            <p>You have access to all chat rooms.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;