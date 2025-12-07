>>>>>>> f039418310695a73ba54394d74519992caeab24d
# Capstone Project - JWT Authentication Implementation

## 🌐 Hosted Links

### 🖥️ Frontend (Deployed on Vercel)
🔗 https://team-sync-beryl.vercel.app/

### ⚙️ Backend (Deployed on Vercel)
🔗 https://team-sync-backend2.vercel.app/

## Backend

### Features

- JWT-based authentication
- User registration and login
- Protected routes using middleware
- MongoDB integration with Mongoose

### Setup

1. Navigate to the backend directory:

   ```
   cd backend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in your values:

   ```
   PORT=5001
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key_here
   ```

4. Start the server:
   ```
   npm run dev
   ```

### Deployment to Vercel

1. Create a new project in Vercel and connect it to your repository
2. Set the following environment variables in your Vercel project settings:
   - `MONGO_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `CLIENT_URL` - Your frontend URL (e.g., https://team-sync-beryl.vercel.app)
3. Configure the build settings:
   - Build Command: `npm install`
   - Output Directory: `.` (default)
   - Install Command: `npm install`
4. Add a health check endpoint is available at `/health` to verify the deployment status

## Frontend

### Features

- React Context for authentication state management
- Login and registration forms
- Protected routes
- JWT token storage in localStorage

### Setup

1. Navigate to the frontend directory:

   ```
   cd frontend
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Team Collaboration

- `GET /api/chat/stream-token` - Get Stream token (protected route)

## Migration Summary

This implementation replaces Clerk authentication with a custom JWT-based solution:

1. **Backend Changes:**

   - Removed Clerk dependencies
   - Implemented JWT middleware for route protection
   - Created auth controller with login/register functions
   - Updated user model for traditional authentication
   - Secured team collaboration routes with JWT middleware

2. **Frontend Changes:**
   - Removed Clerk package and logic
   - Implemented React Context for authentication state
   - Created login/register forms
   - Added JWT token management in localStorage
   - Protected routes using custom authentication context

## Troubleshooting

If you encounter MongoDB connection timeouts on Vercel:

1. Verify that your `MONGO_URI` environment variable is correctly set in Vercel
2. Check that your MongoDB Atlas cluster allows connections from Vercel's IP addresses
3. Use the `/health` endpoint to check the database connection status
4. Ensure your JWT_SECRET is set and is sufficiently complex
=======
>>>>>>> f039418310695a73ba54394d74519992caeab24d
