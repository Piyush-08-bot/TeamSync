

# Capstone Project - JWT Authentication Implementation

## 🌐 Hosted Links

### 🖥️ Frontend (Deployed on Vercel)

🔗 https://team-sync-frontend.netlify.app/

### ⚙️ Backend (Deployed on Vercel)

🔗 https://teamsync-kthq.onrender.com/

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

- `GET /api/chat/stream-token` - Get Stream token (protected route)
