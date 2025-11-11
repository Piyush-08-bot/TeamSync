import React, { createContext, useContext, useState, useEffect } from 'react';
import { AUTH_ENDPOINTS } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on initial load
    const token = localStorage.getItem('token');
    console.log('Token found in localStorage:', token);
    if (token) {
      // Validate token with backend to get user data
      validateToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async (token) => {
    try {
      // In a real app, you would have an endpoint to validate the token
      // For now, we'll just set the user as authenticated
      // You could implement a /api/auth/me endpoint to get user data
      setAuthUser({ token });
      setIsLoading(false);
    } catch (error) {
      console.error('Token validation error:', error);
      localStorage.removeItem('token');
      setAuthUser(null);
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password });
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('Login endpoint:', AUTH_ENDPOINTS.LOGIN);
      const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', res.status);
      const data = await res.json();
      console.log('Login response data:', data);

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setAuthUser(data);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login' };
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('Attempting registration with:', { name, email, password });
      console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
      console.log('Register endpoint:', AUTH_ENDPOINTS.REGISTER);
      const res = await fetch(AUTH_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      console.log('Registration response status:', res.status);
      const data = await res.json();
      console.log('Registration response data:', data);

      if (res.ok) {
        localStorage.setItem('token', data.token);
        setAuthUser(data);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'An error occurred during registration' };
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setAuthUser(null);
    // In a real app, you might want to call a logout endpoint on the backend
  };

  const value = {
    authUser,
    isLoading,
    login,
    register,
    logout,
    validateToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};