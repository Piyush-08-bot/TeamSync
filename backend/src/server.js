import express from 'express';
import { ENV } from './config/env.js'; // importing local files must add extension(.js) in the end
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import cors from 'cors';

const app = express();

// Add early logging to see environment variables
console.log("=== Server Startup Debug Info ===");
console.log("NODE_ENV:", ENV.NODE_ENV);
console.log("PORT:", ENV.PORT);
console.log("MONGO_URI:", ENV.MONGO_URI ? "Set" : "Not set");
console.log("JWT_SECRET:", ENV.JWT_SECRET ? "Set" : "Not set");
console.log("CLIENT_URL:", ENV.CLIENT_URL);
console.log("================================");

// Add middleware to log all requests
app.use((req, res, next) => {
    console.log(`=== ${req.method} ${req.path} ===`);
    console.log("Request body:", JSON.stringify(req.body, null, 2));
    next();
});

// Middleware
app.use(express.json());

// More permissive CORS configuration
app.use(cors({
    origin: true, // Reflect the request origin
    credentials: true
}));

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error('=== Global Error Handler ===');
    console.error('Error occurred:', err);
    console.error('Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
    });

    if (err.code === 'EBADCSRFTOKEN') {
        // Handle CSRF token errors
        res.status(403).json({ message: 'Form tampered with' });
    } else {
        // Handle other errors
        res.status(500).json({
            message: 'Internal server error',
            error: err.message,
            // Remove stack in production
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
    res.send("Welcome to TeamSync")
})

app.listen(ENV.PORT, () => {
    console.log("Server started on port:", ENV.PORT)
    connectDB()
})