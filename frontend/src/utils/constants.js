// API Constants
// Use production backend URL by default, fallback to local proxy in development
const isProduction = import.meta.env.PROD;
export const API_BASE_URL = isProduction 
  ? 'https://team-sync-backend-orcin.vercel.app/api' 
  : (import.meta.env.VITE_API_BASE_URL || '/api');

console.log('Environment:', isProduction ? 'production' : 'development');
console.log('API_BASE_URL being used:', API_BASE_URL);

// Auth endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
};

// Team collaboration endpoints
export const TEAM_ENDPOINTS = {
  // Add team collaboration endpoints here as needed
};