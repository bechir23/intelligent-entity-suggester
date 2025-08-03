import { io, Socket } from 'socket.io-client';
import type { WebSocketEvents, SuggestionResponse } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Function[]> = new Map();

  connect(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:3001';
      
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      this.socket.on('connect', () => {
        console.log('✅ WebSocket connected:', this.socket?.id);
        resolve(this.socket!);
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ WebSocket connection error:', error);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 WebSocket disconnected:', reason);
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Handle suggestions response
    this.socket.on('suggestions_response', (data: SuggestionResponse & { requestId: string }) => {
      this.emit('suggestions_response', data);
    });

    this.socket.on('suggestions_error', (data: { error: string; message: string }) => {
      this.emit('suggestions_error', data);
    });

    // Handle collaborative features
    this.socket.on('user_joined', (data) => this.emit('user_joined', data));
    this.socket.on('user_left', (data) => this.emit('user_left', data));
    this.socket.on('user_typing', (data) => this.emit('user_typing', data));
    this.socket.on('cursor_position', (data) => this.emit('cursor_position', data));
    this.socket.on('selection_changed', (data) => this.emit('selection_changed', data));
    this.socket.on('metadata_added', (data) => this.emit('metadata_added', data));
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  // Event emitters
  requestSuggestions(data: WebSocketEvents['request_suggestions']): void {
    if (this.socket) {
      this.socket.emit('request_suggestions', data);
    }
  }

  joinDocument(documentId: string): void {
    if (this.socket) {
      this.socket.emit('join_document', documentId);
    }
  }

  leaveDocument(documentId: string): void {
    if (this.socket) {
      this.socket.emit('leave_document', documentId);
    }
  }

  updateCursor(data: WebSocketEvents['cursor_update']): void {
    if (this.socket) {
      this.socket.emit('cursor_update', data);
    }
  }

  updateSelection(data: WebSocketEvents['selection_update']): void {
    if (this.socket) {
      this.socket.emit('selection_update', data);
    }
  }

  insertMetadata(data: WebSocketEvents['metadata_inserted']): void {
    if (this.socket) {
      this.socket.emit('metadata_inserted', data);
    }
  }

  // Event listeners
  on<K extends keyof WebSocketEvents>(event: K, callback: (data: WebSocketEvents[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off<K extends keyof WebSocketEvents>(event: K, callback: (data: WebSocketEvents[K]) => void): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const webSocketService = new WebSocketService();
export default webSocketService;
