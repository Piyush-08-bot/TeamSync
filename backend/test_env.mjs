import { ENV } from "./src/config/env.js";
import { connectDB } from "./src/config/db.js";
import jwt from 'jsonwebtoken';

console.log('Environment variables check:');
console.log('- JWT_SECRET:', ENV.JWT_SECRET ? 'SET' : 'MISSING');
console.log('- MONGO_URI:', ENV.MONGO_URI ? 'SET' : 'MISSING');
console.log('- NODE_ENV:', ENV.NODE_ENV);
console.log('- STREAM_API_KEY:', ENV.STREAM_API_KEY ? 'SET' : 'MISSING');
console.log('- STREAM_API_SECRET:', ENV.STREAM_API_SECRET ? 'SET' : 'MISSING');

// Test database connection
try {
    await connectDB();
    console.log('✅ Database connection successful');
} catch (error) {
    console.error('❌ Database connection failed:', error.message);
}

// Test JWT token generation
if (ENV.JWT_SECRET) {
    try {
        const testToken = jwt.sign({ test: 'data' }, ENV.JWT_SECRET, { expiresIn: '1h' });
        console.log('✅ JWT token generation successful');
    } catch (error) {
        console.error('❌ JWT token generation failed:', error.message);
    }
} else {
    console.log('❌ JWT_SECRET not configured');
}