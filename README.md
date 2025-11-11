# Capstone Project - JWT Authentication Implementation

This project demonstrates a complete migration from Clerk-based authentication to JWT-based authentication.

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
