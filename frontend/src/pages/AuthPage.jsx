import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import toast from 'react-hot-toast';
import '../styles/auth.css';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        
        const result = await login(email, password);
        
        if (result.success) {
          
          const token = localStorage.getItem('token');
          if (token) {
            
            try {
              const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });
              
              if (userResponse.ok) {
                const userData = await userResponse.json();
                
                if (userData.isOnboarded) {
                  navigate('/');
                  toast.success('Successfully signed in!');
                } else {
                  navigate('/onboarding');
                  toast.success('Please complete your profile setup');
                }
              } else {
                navigate('/onboarding');
              }
            } catch (err) {
              console.error('Error fetching user data:', err);
              navigate('/onboarding');
            }
          }
        } else {
          setError(result.message || 'Failed to sign in');
        }
      } else {
        
        if (!name || !email || !password) {
          setError('All fields are required');
          setLoading(false);
          return;
        }
        
        const result = await register(name, email, password);
        
        if (result.success) {
          
          navigate('/onboarding');
          toast.success('Account created successfully! Please complete your profile.');
        } else {
          setError(result.message || 'Failed to create account');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-hero">
          <div className="brand-container">
            <img src="/logo.png" alt="TeamSync" className="brand-logo" />
            <span className="brand-name">TeamSync</span>
          </div>

          <h1 className="hero-title">Where Work Happens ✨</h1>

          <p className="hero-subtitle">
            Connect with your team instantly through secure, real-time messaging. Experience
            seamless collaboration with powerful features designed for modern teams.
          </p>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">💬</span>
              <span>Real-time messaging</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🎥</span>
              <span>Video calls & meetings</span>
            </div>

            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure & private</span>
            </div>
          </div>

          <button 
            className="cta-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
            <span className="button-arrow">→</span>
          </button>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-container">
          <div className="auth-form-wrapper">
            <h2 className="form-title">{isLogin ? 'Sign in to TeamSync' : 'Create an account'}</h2>
            <p className="form-subtitle">
              {isLogin ? 'Welcome back! Please enter your details.' : 'Enter your details to get started.'}
            </p>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Full name</label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                    placeholder="Enter your full name"
                  />
                </div>
              )}
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={isLogin ? "Enter your password" : "Create a password"}
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading} 
                className="submit-button"
              >
                {loading ? (isLogin ? 'Signing in...' : 'Creating account...') : (isLogin ? 'Sign in' : 'Sign up')}
              </button>
            </form>
            
            <div className="form-footer">
              <p>
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <Link 
                  to="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsLogin(!isLogin);
                  }}
                  className="toggle-link"
                >
                  {isLogin ? 'Sign up' : 'Sign in'}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;