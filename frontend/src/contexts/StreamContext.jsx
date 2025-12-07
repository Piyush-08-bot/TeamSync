import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { StreamChat } from 'stream-chat';
import { StreamVideoClient } from '@stream-io/video-react-sdk';
import { getStreamChatToken, getStreamVideoToken } from '../services/api';
import { useAuth } from './AuthContext';

const StreamContext = createContext();

export const StreamProvider = ({ children }) => {
  const [chatClient, setChatClient] = useState(null);
  const [videoClient, setVideoClient] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [loading, setLoading] = useState(false); 
  const [error, setError] = useState(null);
  const { authUser, isLoading: authLoading } = useAuth();

  
  const chatClientRef = useRef(null);
  const videoClientRef = useRef(null);

  useEffect(() => {
    
    if (authLoading) {
      return;
    }

    let isMounted = true;
    let currentChatClient = null;
    let currentVideoClient = null;

    const initClients = async () => {
      
      setIsReady(false);
      setError(null);

      if (!authUser) {
        
        const currentChat = chatClientRef.current;
        const currentVideo = videoClientRef.current;

        if (currentChat) {
          try {
            await currentChat.disconnectUser();
          } catch (err) {
            console.warn('StreamContext: Error disconnecting chat client:', err);
          }
        }
        if (currentVideo) {
          try {
            await currentVideo.disconnectUser();
          } catch (err) {
            console.warn('StreamContext: Error disconnecting video client:', err);
          }
        }

        if (isMounted) {
          setChatClient(null);
          setVideoClient(null);
          chatClientRef.current = null;
          videoClientRef.current = null;
          setLoading(false);
        }
        return;
      }

      
      const existingChatClient = chatClientRef.current;
      if (existingChatClient && existingChatClient.userID === authUser._id?.toString()) {
        console.log('StreamContext: Already connected, skipping initialization');
        if (isMounted) {
          setLoading(false);
          setIsReady(true);
        }
        return;
      }

      setLoading(true);

      try {
        console.log('StreamContext: Initializing Stream clients...');

        
        if (chatClientRef.current) {
          console.log('StreamContext: Disconnecting existing chat client');
          try {
            await chatClientRef.current.disconnectUser();
          } catch (err) {
            console.warn('StreamContext: Error disconnecting existing chat client:', err);
          }
        }

        
        console.log('StreamContext: Fetching chat token...');
        const chatData = await getStreamChatToken();
        console.log('StreamContext: Chat token received', chatData);
        
        // Add validation for required fields
        if (!chatData.apiKey) {
          throw new Error('API Key is missing from chat token response. Please check your backend configuration.');
        }
        if (!chatData.token) {
          throw new Error('Token is missing from chat token response');
        }
        if (!chatData.userId) {
          throw new Error('User ID is missing from chat token response');
        }
        
        // Validate that the API key is not empty
        if (typeof chatData.apiKey !== 'string' || chatData.apiKey.trim() === '') {
          throw new Error('Invalid API Key received from backend. API Key must be a non-empty string.');
        }

        // Initialize Stream chat client with additional options for better error handling
        // Using the constructor approach instead of getInstance for better control
        const newChatClient = new StreamChat(chatData.apiKey, {
          timeout: 10000, // Increase timeout for slow connections
          baseURL: 'https://chat.stream-io-api.com' // Explicitly set the base URL
        });

        
        if (newChatClient.userID && newChatClient.userID === chatData.userId) {
          console.log('StreamContext: Chat client already connected to this user');
          currentChatClient = newChatClient;
        } else {
          try {
            // Use additional options for the connection
            await newChatClient.connectUser(
              {
                id: chatData.userId,
                name: authUser.name || `User ${chatData.userId}`,
                image: authUser.image || `https://getstream.io/random_svg/?id=${chatData.userId}&name=${authUser.name || 'User'}`
              },
              chatData.token,
              { // Additional connection options
                timeout: 10000,
                enableWSFallback: true // Enable WebSocket fallback
              }
            );
            currentChatClient = newChatClient;
          } catch (connectError) {
            console.error('StreamContext: Error connecting user to chat:', connectError);
            // Log additional debugging information
            console.error('StreamContext: Debug info:', {
              apiKey: chatData.apiKey,
              userId: chatData.userId,
              tokenLength: chatData.token?.length,
              tokenType: typeof chatData.token
            });
            
            // Check if this is a WebSocket error
            if (connectError.message && connectError.message.includes('api_key not found')) {
              console.error('StreamContext: This appears to be a WebSocket API key error. This usually means the API key is invalid or not properly configured.');
            }
            
            throw new Error(`Failed to connect to chat: ${connectError.message}`);
          }
        }

        if (isMounted) {
          setChatClient(currentChatClient);
          chatClientRef.current = currentChatClient;
          console.log('StreamContext: Chat client connected');
        }

        
        let videoClientReady = false;
        try {
          console.log('StreamContext: Fetching video token...');
          const videoData = await getStreamVideoToken();
          console.log('StreamContext: Video token received', videoData);
          
          // Add validation for required fields in video data
          if (!videoData.apiKey) {
            throw new Error('API Key is missing from video token response. Please check your backend configuration.');
          }
          if (!videoData.token) {
            throw new Error('Token is missing from video token response');
          }
          if (!videoData.userId) {
            throw new Error('User ID is missing from video token response');
          }
          
          // Validate that the API key is not empty
          if (typeof videoData.apiKey !== 'string' || videoData.apiKey.trim() === '') {
            throw new Error('Invalid API Key received from backend for video. API Key must be a non-empty string.');
          }

          const newVideoClient = new StreamVideoClient({
            apiKey: videoData.apiKey,
            user: {
              id: videoData.userId,
              name: authUser.name || `User ${videoData.userId}`,
              image: authUser.image || ''
            },
            token: videoData.token
          });

          
          
          console.log('StreamContext: Video client created, verifying connection...');

          
          await new Promise(resolve => setTimeout(resolve, 100));

          if (isMounted) {
            setVideoClient(newVideoClient);
            videoClientRef.current = newVideoClient;
            videoClientReady = true;
            console.log('StreamContext: Video client connected and ready for event listeners');
          }
        } catch (videoErr) {
          console.warn('StreamContext: Video client initialization failed (non-critical):', videoErr);
          // Log additional debugging information for video client
          console.warn('StreamContext: Video debug info:', {
            message: videoErr.message,
            stack: videoErr.stack
          });
          
          if (isMounted) {
            setVideoClient(null);
            videoClientRef.current = null;
          }
        }

        
        
        if (isMounted) {
          console.log('StreamContext: Setting isReady to true', {
            chatClientReady: !!currentChatClient,
            videoClientReady
          });
          setIsReady(true);
        }
      } catch (err) {
        console.error('StreamContext: Failed to initialize Stream clients:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize chat services');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initClients();

    
    return () => {
      isMounted = false;
      
      // Clean up Stream clients when component unmounts
      if (chatClientRef.current) {
        try {
          chatClientRef.current.disconnectUser();
        } catch (err) {
          console.warn('StreamContext: Error disconnecting chat client on cleanup:', err);
        }
      }
      
      if (videoClientRef.current) {
        try {
          videoClientRef.current.disconnectUser();
        } catch (err) {
          console.warn('StreamContext: Error disconnecting video client on cleanup:', err);
        }
      }
    };
  }, [authUser, authLoading]);

  const value = {
    chatClient,
    videoClient,
    isReady,
    loading,
    error
  };

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  );
};

export const useStream = () => useContext(StreamContext);