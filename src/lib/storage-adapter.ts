import { LEDFile } from './file-storage';
import { RestStorage } from './rest-storage';

// Get ESP32 REST API URL from environment variable
const getESP32RestUrl = () => {
  console.log('🔍 Debug: Checking REST API URL...');
  console.log('🔍 Debug: All env vars:', import.meta.env);
  console.log('🔍 Debug: import.meta.env.VITE_ESP32_REST_URL =', import.meta.env.VITE_ESP32_REST_URL);

  if (import.meta.env.VITE_ESP32_REST_URL) {
    console.log('🔍 Debug: Using environment variable:', import.meta.env.VITE_ESP32_REST_URL);
    return import.meta.env.VITE_ESP32_REST_URL;
  }

  // Fallback to ESP32 IP address
  console.log('🔍 Debug: Using fallback URL: http://192.168.87.211');
  return 'http://192.168.87.211';
};

// Check if we should use REST API (hybrid mode or production)
const shouldUseRestApi = () => {
  // Check if we're running in Lovable (development mode without ESP32)
  if (import.meta.env.DEV && !import.meta.env.VITE_ESP32_REST_URL) {
    console.log('🔍 Debug: Running in Lovable - using local storage only');
    return false;
  }

  // In development mode with ESP32 URL, try REST API for ESP32 communication
  if (import.meta.env.DEV && import.meta.env.VITE_ESP32_REST_URL) {
    console.log('🔍 Debug: Running in hybrid mode - attempting ESP32 connection');
    return true;
  }

  // In production, always try REST API
  console.log('🔍 Debug: Running in production - attempting ESP32 connection');
  return true;
};

class HybridStorageAdapter {
  private restStorage: RestStorage | null = null;
  private localStorage: Storage;
  private isRestApiMode: boolean;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.localStorage = window.localStorage;
    this.isRestApiMode = shouldUseRestApi();

    if (this.isRestApiMode) {
      this.connectionPromise = this.initRestApi();
    }
  }

  private async initRestApi() {
    try {
      const restUrl = getESP32RestUrl();
      console.log('🔍 Debug: Attempting to connect to REST API at:', restUrl);

      this.restStorage = new RestStorage({
        baseUrl: restUrl,
        timeout: 5000
      });

      console.log('🔍 Debug: Calling restStorage.connect()...');
      await this.restStorage.connect();
      console.log('✅ REST API connected for hybrid mode');
    } catch (error) {
      console.error('❌ Failed to connect to ESP32 REST API, falling back to local storage:', error);
      this.isRestApiMode = false;
      throw error;
    }
  }

  async createFile(file: LEDFile): Promise<void> {
    if (this.isRestApiMode && this.restStorage) {
      // Wait for connection to be established
      if (this.connectionPromise) {
        await this.connectionPromise;
      }

      // Create new file on ESP32 via REST API (fails if exists)
      try {
        await this.restStorage.createFile(file);
      } catch (error) {
        console.error('❌ Failed to create file via REST API:', error);
        throw new Error('Failed to create file on ESP32: ' + (error instanceof Error ? error.message : String(error)));
      }
      // Also save locally for backup/caching
      this.localStorage.setItem(`${file.name}`, JSON.stringify(file));
    } else {
      // Check if file exists in local storage
      const existingFile = this.localStorage.getItem(`${file.name}`);
      if (existingFile) {
        throw new Error('File already exists');
      }
      // Create new file in local storage
      this.localStorage.setItem(`${file.name}`, JSON.stringify(file));
    }
  }

  async saveFile(file: LEDFile): Promise<void> {
    if (this.isRestApiMode && this.restStorage) {
      // Wait for connection to be established
      if (this.connectionPromise) {
        await this.connectionPromise;
      }

      // Send to ESP32 via REST API
      try {
        await this.restStorage.saveFile(file);
      } catch (error) {
        console.error('❌ Failed to save via REST API:', error);
        throw new Error('Failed to save file to ESP32: ' + (error instanceof Error ? error.message : String(error)));
      }
      // Also save locally for backup/caching
      this.localStorage.setItem(`${file.name}`, JSON.stringify(file));
    } else {
      // Use local storage
      this.localStorage.setItem(`${file.name}`, JSON.stringify(file));
    }
  }

  async getFile(name: string): Promise<LEDFile | null> {
    if (this.isRestApiMode && this.restStorage) {
      // Wait for connection to be established
      if (this.connectionPromise) {
        await this.connectionPromise;
      }

      // Request from ESP32 via REST API
      try {
        const file = await this.restStorage.requestFile(name);
        if (file) {
          // Also save locally for backup/caching
          this.localStorage.setItem(`${name}`, JSON.stringify(file));
        }
        return file;
      } catch (error) {
        console.error('❌ Failed to request file via REST API:', error);
        throw new Error('Failed to load file from ESP32: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      // Use local storage
      const data = this.localStorage.getItem(`${name}`);
      return data ? JSON.parse(data) : null;
    }
  }

  async getAllFiles(): Promise<LEDFile[]> {
    if (this.isRestApiMode && this.restStorage) {
      // Wait for connection to be established
      if (this.connectionPromise) {
        await this.connectionPromise;
      }

      // Request from ESP32 via REST API
      try {
        const files = await this.restStorage.requestAllFiles();
        // Also save locally for backup/caching
        files.forEach(file => {
          this.localStorage.setItem(`${file.name}`, JSON.stringify(file));
        });
        return files;
      } catch (error) {
        console.error('❌ REST API request failed:', error);
        throw new Error('Failed to load files from ESP32: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      // Use local storage
      return this.getLocalFiles();
    }
  }

  // Get files from local storage only
  getLocalFiles(): LEDFile[] {
    const files: LEDFile[] = [];
    for (let i = 0; i < this.localStorage.length; i++) {
      const key = this.localStorage.key(i);
      if (key && key.endsWith('.led')) {
        try {
          const data = this.localStorage.getItem(key);
          if (data) {
            files.push(JSON.parse(data));
          }
        } catch (error) {
          console.error('Failed to parse file:', key, error);
        }
      }
    }
    return files.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async deleteFile(name: string): Promise<void> {
    if (this.isRestApiMode && this.restStorage) {
      // Send delete request to ESP32
      this.restStorage.deleteFile(name);
    }
    // Always delete from local storage
    this.localStorage.removeItem(`${name}`);
  }

  // Playlist methods (similar pattern)
  async savePlaylist(playlist: any): Promise<void> {
    if (this.isRestApiMode && this.restStorage) {
      this.restStorage.savePlaylist(playlist);
    }
    this.localStorage.setItem(`playlist_${playlist.id}`, JSON.stringify(playlist));
  }

  async getPlaylist(id: string): Promise<any | null> {
    if (this.isRestApiMode && this.restStorage) {
      this.restStorage.requestPlaylist(id);
    }
    const data = this.localStorage.getItem(`playlist_${id}`);
    return data ? JSON.parse(data) : null;
  }

  async getAllPlaylists(): Promise<any[]> {
    if (this.isRestApiMode && this.restStorage) {
      this.restStorage.requestAllPlaylists();
    }
    return this.getLocalPlaylists();
  }

  private getLocalPlaylists(): any[] {
    const playlists: any[] = [];
    for (let i = 0; i < this.localStorage.length; i++) {
      const key = this.localStorage.key(i);
      if (key && key.startsWith('playlist_')) {
        try {
          const playlist = JSON.parse(this.localStorage.getItem(key)!);
          playlists.push(playlist);
        } catch (error) {
          console.error('Failed to parse playlist:', key, error);
        }
      }
    }
    return playlists.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  async deletePlaylist(id: string): Promise<void> {
    if (this.isRestApiMode && this.restStorage) {
      this.restStorage.deletePlaylist(id);
    }
    this.localStorage.removeItem(`playlist_${id}`);
  }

  // Method to check if REST API is connected
  isRestApiConnected(): boolean {
    return this.isRestApiMode && this.restStorage !== null;
  }

  // Method to manually switch modes (for testing)
  setRestApiMode(enabled: boolean) {
    this.isRestApiMode = enabled;
    if (enabled && !this.restStorage) {
      this.connectionPromise = this.initRestApi();
    }
  }
}

export const storageAdapter = new HybridStorageAdapter();
