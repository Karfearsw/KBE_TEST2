import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';

// Define message types
type WSMessageType = 
  | 'activity_created'
  | 'lead_created'
  | 'lead_updated'
  | 'call_created'
  | 'call_scheduled'
  | 'call_updated'
  | 'auth';

interface WSMessage {
  type: WSMessageType;
  data: any;
}

// Active client connections
let clients: Map<string, WebSocket> = new Map();

export function setupWebsocketServer(httpServer: Server) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('New WebSocket connection established');
    let userId: string | null = null;
    
    ws.on('message', (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString()) as WSMessage;
        
        // Handle authentication
        if (parsedMessage.type === 'auth' && parsedMessage.data.userId) {
          userId = parsedMessage.data.userId.toString();
          clients.set(userId, ws);
          console.log(`User ${userId} authenticated on WebSocket`);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
      }
    });
  });
  
  return wss;
}

// Broadcast message to all authenticated clients
export function broadcastMessage(message: WSMessage) {
  clients.forEach((client, userId) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// Send message to a specific user
export function sendMessageToUser(userId: string | number, message: WSMessage) {
  const userIdStr = userId.toString();
  const client = clients.get(userIdStr);
  
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(message));
  }
}
