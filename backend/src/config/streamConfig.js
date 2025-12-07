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
  console.log('✅ All Stream credentials are present');
  return true;
};

let chatServer = null;
let videoServer = null;
let isInitialized = false;

const initializeClients = () => {
  try {
    console.log('🔄 Initializing Stream clients...');
    console.log('STREAM_API_KEY:', ENV.STREAM_API_KEY ? 'SET' : 'MISSING');
    console.log('STREAM_API_SECRET:', ENV.STREAM_API_SECRET ? 'SET' : 'MISSING');
    
    // Validate environment variables first
    if (!validateEnv()) {
      console.log('❌ Stream validation failed');
      isInitialized = false;
      return false;
    }

    // Always recreate clients to ensure fresh connections
    if (chatServer) {
      console.log('🔄 Disposing existing StreamChat client...');
      try {
        // StreamChat doesn't have a dispose method, but we'll create a new instance
      } catch (e) {
        console.warn('Warning while disposing chat client:', e.message);
      }
    }

    console.log('🔄 Creating StreamChat client...');
    console.log('Using API Key:', ENV.STREAM_API_KEY);
    console.log('API Key length:', ENV.STREAM_API_KEY?.length);
    console.log('Secret length:', ENV.STREAM_API_SECRET?.length);
    
    // Use getInstance method which is the recommended approach
    chatServer = StreamChat.getInstance(ENV.STREAM_API_KEY, ENV.STREAM_API_SECRET);
    console.log('✅ StreamChat client created with API key:', chatServer.key);
    
    if (videoServer) {
      console.log('🔄 Disposing existing StreamVideoClient...');
      try {
        // StreamVideoClient doesn't have a dispose method, but we'll create a new instance
      } catch (e) {
        console.warn('Warning while disposing video client:', e.message);
      }
    }

    console.log('🔄 Creating StreamVideoClient...');
    videoServer = new StreamVideoClient({
      apiKey: ENV.STREAM_API_KEY,
      secret: ENV.STREAM_API_SECRET,
    });
    console.log('✅ StreamVideoClient created');

    isInitialized = true;
    console.log('✅ Stream clients initialized');
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize Stream clients:', error.message);
    console.error('Error stack:', error.stack);
    isInitialized = false;
    chatServer = null;
    videoServer = null;
    return false;
  }
};

console.log('🔄 Calling initializeClients...');
const result = initializeClients();
console.log('🔄 initializeClients result:', result);

export const getChatServer = () => {
  console.log('🔄 getChatServer called, isInitialized:', isInitialized);
  console.log('🔄 chatServer exists:', !!chatServer);
  console.log('🔄 chatServer key:', chatServer?.key);
  if (!isInitialized || !chatServer) {
    console.log('🔄 Reinitializing Stream clients...');
    initializeClients();
  }
  return chatServer;
};

export const getVideoServer = () => {
  console.log('🔄 getVideoServer called, isInitialized:', isInitialized);
  console.log('🔄 videoServer exists:', !!videoServer);
  if (!isInitialized || !videoServer) {
    console.log('🔄 Reinitializing Stream clients...');
    initializeClients();
  }
  return videoServer;
};

export { isInitialized };