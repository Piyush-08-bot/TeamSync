import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const SignUpForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', { name, email, password });
    setLoading(true);
    setError('');

    const result = await register(name, email, password);
    console.log('Registration result:', result);
    
    if (!result.success) {
      setError(result.message);
    }
    
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="name">Full name</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            console.log('Name changed to:', e.target.value);
            setName(e.target.value);
          }}
          required
          placeholder="Enter your full name"
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => {
            console.log('Email changed to:', e.target.value);
            setEmail(e.target.value);
          }}
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
          onChange={(e) => {
            console.log('Password changed to:', e.target.value);
            setPassword(e.target.value);
          }}
          required
          placeholder="Create a password"
        />
      </div>
      
      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating account...' : 'Sign up'}
      </button>
    </form>
  );
};

export default SignUpForm;