// API Constants
const isProduction = import.meta.env.PROD;
const backendDomain = 'https://team-sync-backend2.vercel.app';

// In production, use the backend domain directly
// In development, use the VITE_API_BASE_URL or fallback to proxy
export const API_BASE_URL = isProduction
    ? `${backendDomain}/api`
    : (import.meta.env.VITE_API_BASE_URL || '/api');

console.log('=== Environment Configuration ===');
console.log('Production mode:', isProduction);
console.log('Backend domain:', backendDomain);
console.log('API Base URL:', API_BASE_URL);
console.log('================================');

// Auth endpoints
export const AUTH_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
};

// Team collaboration endpoints
export const TEAM_ENDPOINTS = {
    // Add team collaboration endpoints here as needed
};