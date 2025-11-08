import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { queryClient } from '@/lib/queryClient';

// Define WebSocket message types
export type WSMessageType = 
  | 'activity_created'
  | 'lead_created'
  | 'lead_updated'
  | 'call_created'
  | 'call_scheduled'
  | 'call_updated'
  | 'auth';

// Define WebSocket message interface
export interface WSMessage {
  type: WSMessageType;
  data: any;
}

type WebSocketContextType = {
  connected: boolean;
  lastMessage: WSMessage | null;
  sendMessage: (message: WSMessage) => void;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user) return;

    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);

    // Set up event handlers
    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      setConnected(true);
      
      // Send authentication message with user ID
      newSocket.send(JSON.stringify({
        type: 'auth',
        data: {
          userId: user.id
        }
      }));
    };

    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setConnected(false);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WSMessage;
        setLastMessage(message);
        handleIncomingMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      newSocket.close();
    };
  }, [user]);

  // Handle incoming messages
  const handleIncomingMessage = (message: WSMessage) => {
    switch (message.type) {
      case 'activity_created':
        queryClient.invalidateQueries({ queryKey: ['/api/activities'] });
        toast({
          title: 'New Activity',
          description: `${message.data.description}`,
        });
        break;
      
      case 'lead_created':
        queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
        toast({
          title: 'New Lead',
          description: `${message.data.name} was added`,
        });
        break;
      
      case 'lead_updated':
        queryClient.invalidateQueries({ queryKey: ['/api/leads'] });
        queryClient.invalidateQueries({ queryKey: ['/api/leads', message.data.id] });
        toast({
          title: 'Lead Updated',
          description: `Lead information was updated`,
        });
        break;
      
      case 'call_created':
        queryClient.invalidateQueries({ queryKey: ['/api/calls'] });
        toast({
          title: 'Call Logged',
          description: `A call was logged for ${message.data.leadName || 'a lead'}`,
        });
        break;
      
      case 'call_scheduled':
        queryClient.invalidateQueries({ queryKey: ['/api/scheduled-calls'] });
        toast({
          title: 'Call Scheduled',
          description: `A call was scheduled for ${message.data.leadName || 'a lead'}`,
        });
        break;
    }
  };

  // Send message to WebSocket server
  const sendMessage = (message: WSMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  };

  return (
    <WebSocketContext.Provider value={{ connected, lastMessage, sendMessage }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}