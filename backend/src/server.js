import express from 'express';
import { ENV } from './config/env.js';
import { connectDB, disconnectDB, isDBConnected } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import chatRoutes from './routes/chat.routes.js';
import streamRoutes from './routes/stream.routes.js';
import webhookRoutes from './routes/webhook.routes.js';
import cors from 'cors';

const app = express();

// Configure CORS for both development and production
const corsOptions = {
  origin: [ENV.CLIENT_URL, 'http://localhost:5176', 'http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(express.json());
app.use(cors(corsOptions));


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});


app.get('/health', async (req, res) => {
  const dbConnected = isDBConnected();
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'Connected' : 'Disconnected',
    environment: ENV.NODE_ENV
  });
});

connectDB().then(() => {
  console.log("✅ Database ready");

  
  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/stream', streamRoutes);
  app.use('/api/webhook', webhookRoutes);

  
  console.log("📋 Registered routes:");
  console.log("  - GET /api/chat/user/search");
  console.log("  - GET /api/chat/users");
  console.log("  - GET /api/chat/test");
  console.log("  - POST /api/stream/chat/channel");
  console.log("  - POST /api/stream/video/call");

  app.get('/', (req, res) => {
    res.send("Welcome to TeamSync")
  })

  
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
      return res.status(404).json({
        error: 'Route not found',
        method: req.method,
        path: req.path,
        message: `The route ${req.method} ${req.path} does not exist`,
        availableRoutes: [
          'GET /api/chat/user/search?userId=...&email=...',
          'GET /api/chat/test',
          'POST /api/stream/chat/channel',
          'POST /api/stream/video/call'
        ]
      });
    }
    next();
  });

  app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
      stack: ENV.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  const server = app.listen(ENV.PORT, () => {
    console.log("✅ Server running on port:", ENV.PORT);
  });

  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await disconnectDB();
    server.close(() => {
      console.log('Server stopped');
      process.exit(0);
    });
  });

}).catch((error) => {
  console.error("❌ Database connection failed:", error.message);
  process.exit(1);
});


process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});