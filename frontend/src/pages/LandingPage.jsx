import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { authUser } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (authUser) {
      navigate('/');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="logo">TeamSync</div>
        <nav className="landing-nav">
          <button onClick={handleGetStarted} className="btn-primary">
            {authUser ? 'Go to App' : 'Sign In'}
          </button>
        </nav>
      </header>

      <main className="landing-main">
        <section className="hero-section">
          <h1 className="hero-title">Welcome to TeamSync</h1>
          <p className="hero-description">
            A modern team collaboration application built with React and Node.js. Experience seamless communication with our intuitive interface.
          </p>
          <button onClick={handleGetStarted} className="btn-large">
            Get Started
          </button>
        </section>

        <section className="features-section">
          <div className="feature-card">
            <h3>Real-time Messaging</h3>
            <p>Instant messaging with real-time updates</p>
          </div>
          <div className="feature-card">
            <h3>Secure Authentication</h3>
            <p>JWT-based secure authentication system</p>
          </div>
          <div className="feature-card">
            <h3>Modern UI</h3>
            <p>Clean and intuitive user interface</p>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <p>© 2023 TeamSync. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;