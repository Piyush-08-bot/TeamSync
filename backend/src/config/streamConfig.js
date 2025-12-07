import { StreamChat } from 'stream-chat';
import { StreamVideoClient } from '@stream-io/node-sdk';
import { ENV } from './env.js';

const validateEnv = () => {
  const missing = [];
  if (!ENV.STREAM_API_KEY) missing.push('STREAM_API_KEY');
  if (!ENV.STREAM_API_SECRET) missing.push('STREAM_API_SECRET');
  if (missing.length > 0) {
    console.warn(`⚠️  Missing Stream credentials: ${missing.join(', ')}. Stream features will be disabled.`);
    return false;
  }
  return true;
};

let chatServer = null;
let videoServer = null;
let isInitialized = false;

const initializeClients = () => {
  try {
    if (!validateEnv()) {
      return false;
    }

    if (!chatServer) {
      chatServer = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
    }

    if (!videoServer) {
      videoServer = new StreamVideoClient({
        apiKey: ENV.STREAM_API_KEY,
        secret: ENV.STREAM_API_SECRET,
      });
    }

    isInitialized = true;
    console.log('✅ Stream clients initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Stream clients:', error.message);
    return false;
  }
};

initializeClients();

export const getChatServer = () => {
  if (!chatServer) initializeClients();
  return chatServer;
};

export const getVideoServer = () => {
  if (!videoServer) initializeClients();
  return videoServer;
};

export { isInitialized };

