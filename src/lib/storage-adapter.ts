
import { fileStorage } from './file-storage';
import { WebSocketStorage } from './websocket-storage';
import type { LEDFile } from './file-storage';

export interface StorageAdapter {
  getAllFiles(): Promise<LEDFile[]>;
  saveFile(file: LEDFile): Promise<void>;
  deleteFile(id: string): Promise<void>;
  getFile(id: string): Promise<LEDFile | null>;
  generateId(): string;
}

class LocalStorageAdapter implements StorageAdapter {
  async getAllFiles(): Promise<LEDFile[]> {
    return fileStorage.getAllFiles();
  }

  async saveFile(file: LEDFile): Promise<void> {
    fileStorage.saveFile(file);
  }

  async deleteFile(id: string): Promise<void> {
    fileStorage.deleteFile(id);
  }

  async getFile(id: string): Promise<LEDFile | null> {
    return fileStorage.getFile(id);
  }

  generateId(): string {
    return fileStorage.generateId();
  }
}

class WebSocketStorageAdapter implements StorageAdapter {
  private wsStorage: WebSocketStorage;
  private filesCache: LEDFile[] = [];
  private isInitialized = false;

  constructor(wsUrl: string) {
    this.wsStorage = new WebSocketStorage({ url: wsUrl });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isInitialized) {
      await this.wsStorage.connect();
      this.isInitialized = true;
    }
  }

  async getAllFiles(): Promise<LEDFile[]> {
    await this.ensureConnected();
    // In a real implementation, you'd request files from the server
    // For now, return cached files
    return this.filesCache;
  }

  async saveFile(file: LEDFile): Promise<void> {
    await this.ensureConnected();
    this.wsStorage.saveFile(file);
    
    // Update local cache
    const existingIndex = this.filesCache.findIndex(f => f.id === file.id);
    if (existingIndex >= 0) {
      this.filesCache[existingIndex] = file;
    } else {
      this.filesCache.push(file);
    }
  }

  async deleteFile(id: string): Promise<void> {
    await this.ensureConnected();
    this.wsStorage.deleteFile(id);
    
    // Update local cache
    this.filesCache = this.filesCache.filter(f => f.id !== id);
  }

  async getFile(id: string): Promise<LEDFile | null> {
    await this.ensureConnected();
    return this.filesCache.find(f => f.id === id) || null;
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Environment detection
const isProduction = () => {
  return window.location.hostname !== 'localhost' && 
         !window.location.hostname.includes('lovable.app') &&
         process.env.NODE_ENV === 'production';
};

// Create the appropriate storage adapter based on environment
export const createStorageAdapter = (): StorageAdapter => {
  if (isProduction()) {
    // In production, use WebSocket storage
    const wsUrl = process.env.VITE_WEBSOCKET_URL || 'ws://your-device-ip:8080/ws';
    return new WebSocketStorageAdapter(wsUrl);
  } else {
    // In development (Lovable), use localStorage
    return new LocalStorageAdapter();
  }
};

// Export a singleton instance
export const storageAdapter = createStorageAdapter();
