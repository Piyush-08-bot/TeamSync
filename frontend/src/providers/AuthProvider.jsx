import React, { createContext, useContext, useEffect } from "react";
import { useAuth as useJwtAuth } from '../contexts/AuthContext';
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export default function AuthProvider({ children }) {
  const { authUser } = useJwtAuth();

  useEffect(() => {
    
    const interceptor = axiosInstance.interceptors.request.use(
      (config) => {
        try {
          
          const token = localStorage.getItem('token');
          console.log('Interceptor - Token found:', !!token);
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Interceptor - Token added to request');
          } else {
            console.log('Interceptor - No token found');
          }
          console.log('Axios request config:', config);
        } catch (error) {
          if (error.message?.includes("auth") || error.message?.includes("token")) {
            toast.error("Authentication issue. Please refresh the page.");
          }
          console.log("Error getting token:", error);
        }
        return config;
      },
      (error) => {
        console.error("Axios request error:", error);
        return Promise.reject(error);
      }
    );

    
    return () => {
      console.log('Removing axios interceptor');
      axiosInstance.interceptors.request.eject(interceptor);
    };
  }, [authUser]); 

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}