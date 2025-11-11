import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginForm from '../components/auth/LoginForm';

const SignInPage = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to dashboard
  React.useEffect(() => {
    if (authUser) {
      navigate('/dashboard');
    }
  }, [authUser, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Sign in to TeamSync</h1>
            <p>Welcome back! Please enter your details.</p>
          </div>
          
          <LoginForm />
          
          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/sign-up">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignInPage;