import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { axiosInstance } from '../lib/axios';
import './OnboardingPage.css';

const OnboardingPage = () => {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { authUser, setAuthUser } = useAuth();

  
  React.useEffect(() => {
    if (authUser) {
      setName(authUser.name || '');
      
      if (authUser.bio) {
        setBio(authUser.bio);
      }
      
      
    }
  }, [authUser]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePic(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      
      
      const profilePicUrl = profilePic ? '/placeholder-profile.png' : '';
      
      console.log('Sending profile update request with data:', { name, bio, profilePic: profilePicUrl });
      
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      console.log('Using token:', token.substring(0, 20) + '...');
      
      // Fixed the endpoint path to use the correct API route
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          bio,
          profilePic: profilePicUrl
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Profile update response:', data);
      
      if (data) {
        
        setAuthUser({
          ...authUser,
          ...data,
          token: authUser.token
        });
      
        
        navigate('/');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      console.error('Error response:', err.response);
      console.error('Error request:', err.request);
      
      let errorMessage = 'Failed to update profile';
      
      if (err.response) {
        
        console.log('Error response data:', err.response.data);
        console.log('Error response status:', err.response.status);
        console.log('Error response headers:', err.response.headers);
        
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        
        console.log('Error request:', err.request);
        errorMessage = 'Network error - please check your connection';
      } else {
        
        console.log('Error message:', err.message);
        errorMessage = err.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <div className="onboarding-header">
          <h1>Welcome to TeamSync!</h1>
          <p>Let's set up your profile to get started</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="onboarding-form">
          {/* Profile Picture Upload */}
          <div className="form-group">
            <label htmlFor="profile-pic">Profile Picture</label>
            <div className="profile-pic-upload">
              {previewImage ? (
                <img 
                  src={previewImage} 
                  alt="Profile Preview" 
                  className="profile-preview"
                />
              ) : (
                <div className="profile-placeholder">
                  <span>👤</span>
                </div>
              )}
              <label className="upload-button">
                Upload Photo
                <input
                  type="file"
                  id="profile-pic"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Name Field */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
            />
          </div>

          {/* Bio Field */}
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows="3"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading} 
            className="submit-button"
          >
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;