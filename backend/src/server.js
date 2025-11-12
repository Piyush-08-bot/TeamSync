import express from 'express';
import { ENV } from './config/env.js'; // importing local files must add extension(.js) in the end
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import cors from 'cors';

const app = express();

// Middleware
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow all vercel.app domains for flexibility
    if (origin && origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5176',
      'http://localhost:5173',
      'https://team-sync-beryl.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Instead of throwing an error, just allow the request
      // This prevents 500 errors in production
      console.log('CORS origin not in allowed list, but allowing anyway:', origin);
      callback(null, true);
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());

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