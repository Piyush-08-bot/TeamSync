# Frontend Deployment Guide

## Deploying to Vercel

### Prerequisites

1. Create a [Vercel account](https://vercel.com)
2. Install Vercel CLI: `npm install -g vercel`

### Environment Variables

Before deploying, set the following environment variables in your Vercel project settings:

```
VITE_API_BASE_URL=https://your-backend-domain.com/api
```

### Deployment Steps

1. **Connect to Vercel**:

   - Push your code to GitHub/GitLab/Bitbucket
   - Import the project in Vercel dashboard
   - Select the frontend directory as the root

2. **Configure Build Settings**:

   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Set Environment Variables**:

   - Go to Project Settings → Environment Variables
   - Add `VITE_API_BASE_URL` with your backend URL

4. **Deploy**:
   - Click "Deploy" to start the deployment
   - Vercel will automatically build and deploy your app

### Local Development

- Development: `npm run dev`
- Build: `npm run build`
- Preview: `npm run preview`

### API Proxying

In development, API requests are proxied through Vite to your backend server.
In production, requests are sent directly to the backend URL specified in `VITE_API_BASE_URL`.
