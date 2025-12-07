import { version } from '../../package.json';

const isProduction = import.meta.env.PROD;
// Use the VITE_API_BASE_URL from environment variables in production
// Fall back to team-sync-backend-orcin.vercel.app if not set
const backendDomain = isProduction
    ? (import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'https://team-sync-backend-orcin.vercel.app')
    : 'http://localhost:5001';

export const API_BASE_URL = isProduction
    ? `${backendDomain}/api`
    : '/api';

console.log('=== Environment Configuration ===');
console.log('App Version:', version);
console.log('Production mode:', isProduction);
console.log('Backend domain:', backendDomain);
console.log('API Base URL:', API_BASE_URL);
console.log('================================');

export const AUTH_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REGISTER: `${API_BASE_URL}/auth/register`,
};

export const TEAM_ENDPOINTS = {

};