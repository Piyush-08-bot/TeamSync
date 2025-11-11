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
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:5176',
      'http://localhost:5173',
      'https://team-sync-frontend.vercel.app'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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
