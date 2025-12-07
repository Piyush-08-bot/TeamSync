
const isProduction = import.meta.env.PROD;
const backendDomain = 'https://team-sync-backend2.vercel.app';



export const API_BASE_URL = isProduction
    ? `${backendDomain}/api`
    : (import.meta.env.VITE_API_BASE_URL || '/api');

console.log('=== Environment Configuration ===');
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