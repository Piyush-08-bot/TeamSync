import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const envPath = path.resolve(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(`Warning: .env file not found at ${envPath}`);
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


console.log('Environment configuration loaded:');
console.log(`- PORT: ${ENV.PORT}`);
console.log(`- MONGO_URI: ${ENV.MONGO_URI ? 'Set' : 'Missing'}`);
console.log(`- JWT_SECRET: ${ENV.JWT_SECRET ? 'Set' : 'Missing'}`);
console.log(`- CLIENT_URL: ${ENV.CLIENT_URL}`);
console.log(`- NODE_ENV: ${ENV.NODE_ENV}`);