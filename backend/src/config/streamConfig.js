import { ENV } from './env.js';
import { StreamChat } from 'stream-chat';

// Simple export of environment variables for Stream
export const STREAM_CONFIG = {
  apiKey: ENV.STREAM_API_KEY,
  secret: ENV.STREAM_API_SECRET
};

// Simple validation function
export const isStreamConfigured = () => {
  return !!ENV.STREAM_API_KEY && !!ENV.STREAM_API_SECRET;
};

// Function to get Stream client
export const getStreamClient = () => {
  if (!isStreamConfigured()) {
    throw new Error('Stream API credentials not configured');
  }
  return StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
};

// Function to upsert user to Stream Chat
export const upsertStreamUser = async (user) => {
  try {
    if (!isStreamConfigured()) {
      console.warn('Stream not configured, skipping user upsert');
      return null;
    }

    const serverClient = getStreamClient();

    // Upsert user to Stream Chat
    const streamUser = {
      id: user._id.toString(),
      name: user.name || user.email,
      email: user.email,
      image: user.profilePic || undefined
    };

    await serverClient.upsertUser(streamUser);
    console.log(`Upserted user ${user._id} to Stream Chat`);
    return streamUser;
  } catch (error) {
    console.error('Error upserting user to Stream Chat:', error.message);
    throw error;
  }
};