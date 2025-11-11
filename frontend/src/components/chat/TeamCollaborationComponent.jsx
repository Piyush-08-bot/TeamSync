import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const TeamCollaborationComponent = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { authUser } = useAuth();

  useEffect(() => {
    if (authUser) {
      // Simulate connecting to collaboration service
      connectToService();
    }
  }, [authUser]);

  const connectToService = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Simulate API call to connect to collaboration service
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful connection
      setConnectionStatus('connected');
    } catch (err) {
      setError('Failed to connect to collaboration service');
      setConnectionStatus('disconnected');
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const disconnectService = () => {
    setConnectionStatus('disconnected');
  };

  if (!authUser) {
    return (
      <div className="team-placeholder">
        <div className="connection-status disconnected">
          <div className="status-indicator"></div>
          <p>Not connected</p>
        </div>
        <p>Please log in to access team collaboration</p>
      </div>
    );
  }

  return (
    <div className="team-component">
      <div className="connection-info">
        <div className={`connection-status ${connectionStatus}`}>
          <div className="status-indicator"></div>
          <span>
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Connecting to collaboration service...</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <div className="connection-actions">
          {connectionStatus === 'connected' ? (
            <button 
              onClick={disconnectService} 
              className="btn-secondary"
              disabled={loading}
            >
              Disconnect
            </button>
          ) : (
            <button 
              onClick={connectToService} 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          )}
        </div>
      </div>
      
      {connectionStatus === 'connected' && (
        <div className="collaboration-features">
          <h4>Team Collaboration Features</h4>
          <ul>
            <li>Real-time messaging</li>
            <li>File sharing</li>
            <li>Video calls</li>
            <li>Task management</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TeamCollaborationComponent;