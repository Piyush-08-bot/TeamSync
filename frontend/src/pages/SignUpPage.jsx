import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SignUpForm from '../components/auth/SignUpForm';

const SignUpPage = () => {
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
            <h1>Create an account</h1>
            <p>Enter your details to get started.</p>
          </div>
          
          <SignUpForm />
          
          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/sign-in">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;