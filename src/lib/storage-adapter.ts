import { LEDFile } from './file-storage';
import { RestStorage } from './rest-storage';
import { currentMode, shouldUseRestApi, getRestApiUrl, logModeInfo } from './mode-detector';

class HybridStorageAdapter {
  private restStorage: RestStorage | null = null;
  private localStorage: Storage;
  private isRestApiMode: boolean;
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    this.localStorage = window.localStorage;
    this.isRestApiMode = shouldUseRestApi();

    // Log mode information for debugging
    logModeInfo();

    if (this.isRestApiMode) {
      this.connectionPromise = this.initRestApi();
    }
  }

  private async initRestApi() {
    try {
      const restUrl = getRestApiUrl();
      if (!restUrl) {
        throw new Error('No ESP32 REST URL configured');
      }

      console.log('Initializing REST API connection to:', restUrl);
      this.restStorage = new RestStorage({ baseUrl: restUrl });
      await this.restStorage.connect();
      console.log('REST API connection established');
    } catch (error) {
      console.error('Failed to initialize REST API:', error);
      this.isRestApiMode = false;
      this.restStorage = null;
      throw error;
    }
  }

  async createFile(file: LEDFile): Promise<void> {
    if (this.isRestApiMode && this.restStorage) {
      // Wait for connection to be established
      if (this.connectionPromise) {
        await this.connectionPromise;
      }

      // Send to ESP32 via REST API
      try {
        await this.restStorage.createFile(file);
      } catch (error) {
        console.error('Failed to create file via REST API:', error);
        throw new Error('Failed to create file on ESP32: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      // Check if file exists in local storage
      const existingFile = this.localStorage.getItem(`${file.name}`);
      if (existingFile) {
        throw new Error('File already exists');
      }

      // Create new file in local storage
      try {
        this.localStorage.setItem(`${file.name}`, JSON.stringify(file));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('❌ localStorage quota exceeded. Please free up some space or use ESP32 mode.');
          throw new Error('Storage quota exceeded. Please delete some files or use ESP32 mode for larger storage.');
        }
        throw error;
      }
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
        console.error('Failed to save file via REST API:', error);
        throw new Error('Failed to save file on ESP32: ' + (error instanceof Error ? error.message : String(error)));
      }
    } else {
      // Use local storage
      try {
        this.localStorage.setItem(`${file.name}`, JSON.stringify(file));
      } catch (error) {
        if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded. Please free up some space or use ESP32 mode.');
          throw new Error('Storage quota exceeded. Please delete some files or use ESP32 mode for larger storage.');
        }
        throw error;
      }
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
        return file;
      } catch (error) {
        console.error('Failed to request file via REST API:', error);
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
        return files;
      } catch (error) {
        console.error('REST API request failed:', error);
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

    // Check for individual file keys (mirrors ESP32 storage)
    for (let i = 0; i < this.localStorage.length; i++) {
      const key = this.localStorage.key(i);
      if (key) {
        // Skip playlist keys
        if (key.startsWith('playlist_')) {
          continue;
        }

        try {
          const data = this.localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            // Check if this is a valid LED file by looking for required properties
            if (parsed &&
                typeof parsed.name === 'string' &&
                Array.isArray(parsed.frames) &&
                typeof parsed.rows === 'number' &&
                typeof parsed.columns === 'number' &&
                typeof parsed.totalFrames === 'number') {
              files.push(parsed);
            }
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
    } else {
      // Delete from local storage
      this.localStorage.removeItem(`${name}`);
    }
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

  // Get SPIFFS storage stats
  async getStorageStats(): Promise<{
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    usagePercentage: number;
  } | null> {
    if (this.isRestApiMode && this.restStorage) {
      // Wait for connection to be established
      if (this.connectionPromise) {
        await this.connectionPromise;
      }

      try {
        return await this.restStorage.getSPIFFSStats();
      } catch (error) {
        console.error('Failed to get SPIFFS stats:', error);
        return null;
      }
    } else {
      // In local storage mode, return null to indicate no ESP32 stats available
      return null;
    }
  }

  // Reset ESP32 metadata system
  async resetMetadata(): Promise<void> {
    if (this.isRestApiMode && this.restStorage) {
      // Wait for connection to be established
      if (this.connectionPromise) {
        await this.connectionPromise;
      }

      try {
        const restUrl = getRestApiUrl();
        const response = await fetch(`${restUrl}/api/reset-metadata`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        console.log('Metadata system reset successfully');
      } catch (error) {
        console.error('Failed to reset metadata system:', error);
        throw error;
      }
    } else {
      throw new Error('Metadata reset only available in ESP32 mode');
    }
  }
}

export const storageAdapter = new HybridStorageAdapter();
