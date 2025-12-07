import React, { createContext, useContext, useState, useEffect } from 'react';
import { AUTH_ENDPOINTS, API_BASE_URL } from '../utils/constants';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('AuthContext: Token found in localStorage:', !!token);
        console.log('AuthContext: API_BASE_URL:', API_BASE_URL);

        
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('AuthContext: Auth check timeout - setting loading to false');
            setIsLoading(false);
          }
        }, 5000); 

        if (token) {
          
          await validateToken(token);
        } else {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('AuthContext: Auth check error:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    };

    checkAuth();

    
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const validateToken = async (token) => {
    try {
      console.log('AuthContext: Validating token...');

      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.warn('AuthContext: Token validation timeout');
        controller.abort();
      }, 8000); 

      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('AuthContext: Token validation response status:', res.status);

      if (res.ok) {
        const userData = await res.json();
        console.log('AuthContext: User data received:', userData);
        setAuthUser({
          ...userData,
          token
        });
      } else {
        
        console.log('AuthContext: Token validation failed, removing token');
        localStorage.removeItem('token');
        setAuthUser(null);
      }
    } catch (error) {
      console.error('AuthContext: Token validation error:', error);
      
      if (error.name !== 'AbortError') {
        console.log('AuthContext: Removing invalid token due to error');
        localStorage.removeItem('token');
        setAuthUser(null);
      }
    } finally {
      
      console.log('AuthContext: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      console.log('=== Login Attempt ===');
      console.log('Email:', email);
      console.log('Login endpoint:', AUTH_ENDPOINTS.LOGIN);

      const res = await fetch(AUTH_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('Login response status:', res.status);
      console.log('Login response headers:', [...res.headers.entries()]);

      let data;
      try {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          data = await res.json();
        } else {
          
          const text = await res.text();
          console.error("Received non-JSON response:", text.substring(0, 200)); 
          data = { message: "Server error. Please check console for details." };
        }
      } catch (parseError) {
        console.error("Error parsing login response:", parseError);
        data = { message: "Failed to parse server response" };
      }

      console.log('Login response data:', data);
      if (res.ok) {
        localStorage.setItem('token', data.token);
        setAuthUser({
          ...data,
          token: data.token
        });

        
        if (!data.isOnboarded) {
          
          console.log('User needs onboarding');
        }

        return { success: true };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'An error occurred during login. Check connection.' };
    }
  };

  const register = async (name, email, password) => {
    try {
      console.log('=== Registration Attempt ===');
      console.log('Name:', name);
      console.log('Email:', email);
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

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        
        setAuthUser({
          _id: data._id,
          name: data.name,
          email: data.email,
          bio: data.bio,
          isOnboarded: data.isOnboarded || false,
          token: data.token
        });

        return { success: true, data };
      } else {
        const errorMessage = data.message || data.error || 'Failed to create account';
        console.error('Registration failed:', errorMessage);
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Network error. Please check your connection and try again.'
      };
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    setAuthUser(null);
    
  };

  const deleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        await logout();
        return { success: true };
      } else {
        const data = await res.json();
        return { success: false, message: data.message || "Failed to delete account" };
      }
    } catch (error) {
      console.error('Delete account error:', error);
      return { success: false, message: "Network error during account deletion" };
    }
  };

  const value = {
    authUser,
    isLoading,
    login,
    register,
    logout,
    validateToken,
    setAuthUser,
    deleteAccount, 
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};