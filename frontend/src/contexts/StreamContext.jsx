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
        console.log('StreamContext: Chat token received');

        const newChatClient = StreamChat.getInstance(chatData.apiKey);

        
        if (newChatClient.userID && newChatClient.userID === chatData.userId) {
          console.log('StreamContext: Chat client already connected to this user');
          currentChatClient = newChatClient;
        } else {
          await newChatClient.connectUser(
            {
              id: chatData.userId,
              name: authUser.name || `User ${chatData.userId}`,
              image: authUser.image || `https://getstream.io/random_svg/?id=${chatData.userId}&name=${authUser.name || 'User'}`
            },
            chatData.token
          );
          currentChatClient = newChatClient;
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
          console.log('StreamContext: Video token received');

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