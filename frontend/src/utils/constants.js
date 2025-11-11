// API Constants
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
};

// Team collaboration endpoints
export const TEAM_ENDPOINTS = {
  // Add team collaboration endpoints here as needed
};