// WebSocket connection management
type WebSocketCallback = (data: any) => void;

interface WebSocketMessage {
  type: string;
  data: any;
}

// Map of event types to callbacks
const listeners: Record<string, WebSocketCallback[]> = {};
let socket: WebSocket | null = null;
let isConnecting = false;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Connect to WebSocket server
export function connectWebSocket(userId: number) {
  // Prevent multiple connection attempts
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) || isConnecting) {
    return;
  }
  
  isConnecting = true;
  
  // Create WebSocket connection
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  
  socket = new WebSocket(wsUrl);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
    isConnecting = false;
    
    // Send authentication message
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'auth',
        data: { userId }
      }));
    }
    
    // Clear any reconnect timers
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };
  
  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      // Dispatch message to all registered listeners
      if (listeners[message.type]) {
        listeners[message.type].forEach(callback => callback(message.data));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onclose = () => {
    console.log('WebSocket connection closed');
    isConnecting = false;
    socket = null;
    
    // Attempt to reconnect after a delay
    reconnectTimer = setTimeout(() => {
      if (userId) {
        connectWebSocket(userId);
      }
    }, 5000);
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    isConnecting = false;
  };
}

// Disconnect WebSocket
export function disconnectWebSocket() {
  if (socket) {
    socket.close();
    socket = null;
  }
  
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

// Add event listener
export function addEventListener(type: string, callback: WebSocketCallback) {
  if (!listeners[type]) {
    listeners[type] = [];
  }
  listeners[type].push(callback);
}

// Remove event listener
export function removeEventListener(type: string, callback: WebSocketCallback) {
  if (listeners[type]) {
    listeners[type] = listeners[type].filter(cb => cb !== callback);
  }
}

// Send message to server
export function sendMessage(type: string, data: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type, data }));
    return true;
  }
  return false;
}
