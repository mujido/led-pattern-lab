
export interface WebSocketStorageConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

export class WebSocketStorage {
  private ws: WebSocket | null = null;
  private config: WebSocketStorageConfig;
  private reconnectCount = 0;
  private messageQueue: any[] = [];
  private isConnected = false;

  constructor(config: WebSocketStorageConfig) {
    this.config = {
      reconnectAttempts: 5,
      reconnectDelay: 1000,
      ...config
    };
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
          this.reconnectCount = 0;
          this.flushMessageQueue();
          resolve();
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectCount < (this.config.reconnectAttempts || 5)) {
      this.reconnectCount++;
      console.log(`Attempting to reconnect (${this.reconnectCount})...`);
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.config.reconnectDelay);
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.sendMessage(message);
    }
  }

  private sendMessage(message: any): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      // Handle incoming messages from server
      console.log('Received message:', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  saveFile(file: any): void {
    this.sendMessage({
      type: 'SAVE_FILE',
      payload: file
    });
  }

  deleteFile(id: string): void {
    this.sendMessage({
      type: 'DELETE_FILE',
      payload: { id }
    });
  }

  requestAllFiles(): void {
    this.sendMessage({
      type: 'GET_ALL_FILES'
    });
  }

  requestFile(id: string): void {
    this.sendMessage({
      type: 'GET_FILE',
      payload: { id }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }
}
