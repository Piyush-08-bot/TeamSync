import { ENV } from './env.js';

// Simple export of environment variables for Stream
export const STREAM_CONFIG = {
  apiKey: ENV.STREAM_API_KEY,
  secret: ENV.STREAM_API_SECRET
};

// Simple validation function
export const isStreamConfigured = () => {
  return !!ENV.STREAM_API_KEY && !!ENV.STREAM_API_SECRET;
};