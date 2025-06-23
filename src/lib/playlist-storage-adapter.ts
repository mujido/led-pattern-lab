import { playlistStorage } from './playlist-storage';
import { WebSocketStorage } from './websocket-storage';
import type { Playlist } from './playlist-storage';

export interface PlaylistStorageAdapter {
  getAllPlaylists(): Promise<Playlist[]>;
  savePlaylist(playlist: Playlist): Promise<void>;
  deletePlaylist(id: string): Promise<void>;
  getPlaylist(id: string): Promise<Playlist | null>;
  generateId(): string;
}

class LocalPlaylistStorageAdapter implements PlaylistStorageAdapter {
  async getAllPlaylists(): Promise<Playlist[]> {
    return playlistStorage.getAllPlaylists();
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    playlistStorage.savePlaylist(playlist);
  }

  async deletePlaylist(id: string): Promise<void> {
    playlistStorage.deletePlaylist(id);
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    return playlistStorage.getPlaylist(id);
  }

  generateId(): string {
    return playlistStorage.generateId();
  }
}

class WebSocketPlaylistStorageAdapter implements PlaylistStorageAdapter {
  private wsStorage: WebSocketStorage;
  private playlistsCache: Playlist[] = [];
  private isInitialized = false;
  private pendingRequests: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();

  constructor(wsUrl: string) {
    this.wsStorage = new WebSocketStorage({ url: wsUrl });
    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    // Handle file responses
    this.wsStorage.onMessage('GET_ALL_PLAYLISTS_RESPONSE', (message) => {
      if (message.status === 'success') {
        try {
          const playlists = JSON.parse(message.data);
          this.playlistsCache = playlists;
          const requestId = 'get_all_playlists';
          const pending = this.pendingRequests.get(requestId);
          if (pending) {
            pending.resolve(playlists);
            this.pendingRequests.delete(requestId);
          }
        } catch (error) {
          console.error('Failed to parse playlists data:', error);
        }
      }
    });

    this.wsStorage.onMessage('GET_PLAYLIST_RESPONSE', (message) => {
      if (message.status === 'success') {
        try {
          const playlist = JSON.parse(message.data);
          const requestId = `get_playlist_${playlist.id}`;
          const pending = this.pendingRequests.get(requestId);
          if (pending) {
            pending.resolve(playlist);
            this.pendingRequests.delete(requestId);
          }
        } catch (error) {
          console.error('Failed to parse playlist data:', error);
        }
      }
    });

    this.wsStorage.onMessage('SAVE_PLAYLIST_RESPONSE', (message) => {
      if (message.status === 'success') {
        // Update local cache
        // Note: In a real implementation, you'd get the updated playlist from the server
      }
    });

    this.wsStorage.onMessage('DELETE_PLAYLIST_RESPONSE', (message) => {
      if (message.status === 'success') {
        // Update local cache
        // Note: In a real implementation, you'd get the updated playlist list from the server
      }
    });
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isInitialized) {
      await this.wsStorage.connect();
      this.isInitialized = true;
    }
  }

  async getAllPlaylists(): Promise<Playlist[]> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set('get_all_playlists', { resolve, reject });
      this.wsStorage.requestAllPlaylists();

      // Timeout after 5 seconds
      setTimeout(() => {
        const pending = this.pendingRequests.get('get_all_playlists');
        if (pending) {
          pending.reject(new Error('Request timeout'));
          this.pendingRequests.delete('get_all_playlists');
        }
      }, 5000);
    });
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    await this.ensureConnected();
    this.wsStorage.savePlaylist(playlist);

    // Update local cache
    const existingIndex = this.playlistsCache.findIndex(p => p.id === playlist.id);
    if (existingIndex >= 0) {
      this.playlistsCache[existingIndex] = playlist;
    } else {
      this.playlistsCache.push(playlist);
    }
  }

  async deletePlaylist(id: string): Promise<void> {
    await this.ensureConnected();
    this.wsStorage.deletePlaylist(id);

    // Update local cache
    this.playlistsCache = this.playlistsCache.filter(p => p.id !== id);
  }

  async getPlaylist(id: string): Promise<Playlist | null> {
    await this.ensureConnected();

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(`get_playlist_${id}`, { resolve, reject });
      this.wsStorage.requestPlaylist(id);

      // Timeout after 5 seconds
      setTimeout(() => {
        const pending = this.pendingRequests.get(`get_playlist_${id}`);
        if (pending) {
          pending.reject(new Error('Request timeout'));
          this.pendingRequests.delete(`get_playlist_${id}`);
        }
      }, 5000);
    });
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

// Environment detection
const isProduction = () => {
  // Check if we're running in Lovable
  if (window.location.hostname.includes('lovable.app')) {
    return false; // Use local storage in Lovable
  }

  // Check if we're running in development mode
  if (import.meta.env.DEV) {
    return false; // Use local storage in development
  }

  // In production (ESP32), use WebSocket storage
  return true;
};

// Create the appropriate storage adapter based on environment
export const createPlaylistStorageAdapter = (): PlaylistStorageAdapter => {
  if (isProduction()) {
    // In production, use WebSocket storage
    const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://your-device-ip:8080/ws';
    return new WebSocketPlaylistStorageAdapter(wsUrl);
  } else {
    // In development (Lovable), use localStorage
    return new LocalPlaylistStorageAdapter();
  }
};

// Export a singleton instance
export const playlistStorageAdapter = createPlaylistStorageAdapter();
