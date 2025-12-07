import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try multiple paths for .env file
const possiblePaths = [
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../.env'),
    path.resolve(__dirname, '.env'),
    path.resolve(process.cwd(), '.env'),
    '.env'
];

let envLoaded = false;
let loadError = null;

// Try loading from each possible path
for (const envPath of possiblePaths) {
    try {
        const result = dotenv.config({ path: envPath });
        if (result.parsed) {
            console.log(`✅ Successfully loaded .env from: ${envPath}`);
            envLoaded = true;
            break;
        }
    } catch (error) {
        // Continue to next path
        loadError = error;
    }
}

if (!envLoaded) {
    console.warn(`⚠️  Warning: Could not load .env file from any of these paths:`, possiblePaths);
    if (loadError) {
        console.warn(`Last error:`, loadError.message);
    }

    // In Vercel, environment variables should be available directly
    console.log('ℹ️  Checking for environment variables from process.env...');
}

export const ENV = {
    PORT: process.env.PORT || 5001,
    MONGO_URI: process.env.MONGO_URI,
    NODE_ENV: process.env.NODE_ENV,
    JWT_SECRET: process.env.JWT_SECRET,
    CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5176',
    STREAM_API_KEY: process.env.STREAM_API_KEY,
    STREAM_API_SECRET: process.env.STREAM_API_SECRET
};

// Log all environment variables (masked secrets for security)
console.log('Environment configuration loaded:');
console.log(`- PORT: ${ENV.PORT}`);
console.log(`- MONGO_URI: ${ENV.MONGO_URI ? 'Set' : 'Missing'}`);
console.log(`- JWT_SECRET: ${ENV.JWT_SECRET ? 'Set' : 'Missing'}`);
console.log(`- CLIENT_URL: ${ENV.CLIENT_URL}`);
console.log(`- NODE_ENV: ${ENV.NODE_ENV}`);
console.log(`- STREAM_API_KEY: ${ENV.STREAM_API_KEY ? 'Set' : 'Missing'}`);
console.log(`- STREAM_API_SECRET: ${ENV.STREAM_API_SECRET ? 'Set' : 'Missing'}`);

// Additional debugging for Stream credentials
if (ENV.STREAM_API_KEY) {
    console.log(`- STREAM_API_KEY (first 5 chars): ${ENV.STREAM_API_KEY.substring(0, 5)}...`);
    console.log(`- STREAM_API_KEY length: ${ENV.STREAM_API_KEY.length}`);
} else {
    console.log('- STREAM_API_KEY: Completely missing');
}

if (ENV.STREAM_API_SECRET) {
    console.log(`- STREAM_API_SECRET length: ${ENV.STREAM_API_SECRET.length}`);
} else {
    console.log('- STREAM_API_SECRET: Completely missing');
}

// Check if we're in a Vercel environment
if (process.env.VERCEL) {
    console.log('ℹ️  Running in Vercel environment');
    console.log(`- VERCEL_ENV: ${process.env.VERCEL_ENV}`);
    console.log(`- VERCEL_URL: ${process.env.VERCEL_URL}`);
} else {
    console.log('ℹ️  Not running in Vercel environment');
}