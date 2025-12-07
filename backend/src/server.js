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
// Adding multiple possible frontend domains to handle different deployment scenarios
const corsOptions = {
  origin: [
    ENV.CLIENT_URL,
    'http://localhost:5176',
    'http://localhost:5173',
    'https://team-sync-beryl.vercel.app',
    'https://team-sync-backend-orcin.vercel.app'  // Add the actual backend domain
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Access-Control-Allow-Origin'] // Expose the header
};

app.use(express.json({ limit: '10mb' }));
app.use(cors(corsOptions));

// Handle preflight requests for all routes - Fixed for Express v5
app.options(/.*/, cors(corsOptions)); // Changed from '*' to /.*/

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} from ${req.ip}`);
  console.log(`Origin: ${req.headers.origin}`);
  console.log(`Headers:`, JSON.stringify(req.headers, null, 2));
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = isDBConnected();
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'Connected' : 'Disconnected',
    environment: ENV.NODE_ENV,
    streamApiKeySet: !!ENV.STREAM_API_KEY,
    streamApiSecretSet: !!ENV.STREAM_API_SECRET,
    clientId: ENV.CLIENT_URL,
    corsOrigins: corsOptions.origin
  });
});

connectDB().then(() => {
  console.log("✅ Database ready");

  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/stream', streamRoutes);
  app.use('/api/webhook', webhookRoutes);

  console.log("📋 Registered routes:");
  console.log("  - POST /api/auth/register");
  console.log("  - POST /api/auth/login");
  console.log("  - GET /api/auth/me");
  console.log("  - PUT /api/auth/profile");
  console.log("  - DELETE /api/auth/profile");
  console.log("  - GET /api/chat/user/search");
  console.log("  - GET /api/chat/users");
  console.log("  - GET /api/chat/test");
  console.log("  - GET /api/stream/chat/token");
  console.log("  - GET /api/stream/video/token");
  console.log("  - GET /api/stream/test-new");  // Add this line
  console.log("  - GET /api/stream/echo");     // Add this line
  console.log("  - POST /api/stream/chat/channel");
  console.log("  - POST /api/stream/chat/group");
  console.log("  - POST /api/stream/video/call");

  app.get('/', (req, res) => {
    res.send("Welcome to TeamSync")
  })

  // Catch-all for API routes that don't exist
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
      // Log available routes for debugging
      const availableRoutes = [
        'POST /api/auth/register',
        'POST /api/auth/login',
        'GET /api/auth/me',
        'PUT /api/auth/profile', 
        'DELETE /api/auth/profile',
        'GET /api/chat/user/search?userId=...&email=...',
        'GET /api/chat/test',
        'GET /api/stream/chat/token',
        'GET /api/stream/video/token',
        'GET /api/stream/test-new',
        'GET /api/stream/echo',
        'POST /api/stream/chat/channel',
        'POST /api/stream/chat/group',
        'POST /api/stream/video/call'
      ];
      console.log(`❌ 404 - Route not found: ${req.method} ${req.path}`);
      return res.status(404).json({
        error: 'Route not found',
        method: req.method,
        path: req.path,
        message: `The route ${req.method} ${req.path} does not exist`,
        availableRoutes
      });
    }
    next();
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Global Error Handler:', err.message);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      message: 'Internal server error',
      error: err.message,
      stack: ENV.NODE_ENV === 'development' ? err.stack : undefined
    });
  });

  const server = app.listen(ENV.PORT, () => {
    console.log("✅ Server running on port:", ENV.PORT);
    console.log("Environment:", ENV.NODE_ENV);
    console.log("Client URL:", ENV.CLIENT_URL);
    console.log("CORS Origins:", corsOptions.origin);
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