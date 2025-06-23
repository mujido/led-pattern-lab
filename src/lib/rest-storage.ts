import { LEDFile } from './file-storage';

interface RestStorageConfig {
  baseUrl: string;
  timeout?: number;
}

// Binary format constants - match ESP32 format
const BINARY_VERSION = 1;

// Calculate timeout based on file size (SPIFFS writes are slow)
function calculateTimeout(fileSize: number): number {
  // Base timeout of 30 seconds for small files
  const baseTimeout = 30000;
  // Add 1 second per 50KB for larger files (conservative estimate for SPIFFS write speed)
  const additionalTimeout = Math.ceil(fileSize / 50000) * 1000;
  return Math.min(baseTimeout + additionalTimeout, 300000); // Cap at 5 minutes
}

export class RestStorage {
  private config: RestStorageConfig;
  private isConnected: boolean = false;

  constructor(config: RestStorageConfig) {
    this.config = {
      timeout: 30000, // Increased default timeout to 30 seconds
      ...config
    };
  }

  async connect(): Promise<void> {
    try {
      // Test connection by making a simple GET request
      const response = await fetch(`${this.config.baseUrl}/api/leds`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (response.ok) {
        this.isConnected = true;
        console.log('✅ REST API connected');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Failed to connect to REST API:', error);
      this.isConnected = false;
      throw error;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Convert LED file to binary format matching ESP32 format
  private convertFileToBinary(file: LEDFile): ArrayBuffer {
    const headerSize = 12; // 1+1+1+1+4+4 (version+rows+columns+total_frames+created+updated)
    const frameDataSize = file.rows * file.columns * file.totalFrames * 3; // RGB per LED (3 bytes)
    const totalSize = headerSize + frameDataSize;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    let offset = 0;

    // Write header (matching ESP32 led_file_header_t)
    view.setUint8(offset, BINARY_VERSION); offset += 1;
    view.setUint8(offset, file.rows); offset += 1;
    view.setUint8(offset, file.columns); offset += 1;
    view.setUint8(offset, file.totalFrames); offset += 1;
    view.setUint32(offset, Math.floor(Date.parse(file.createdAt) / 1000), false); offset += 4;
    view.setUint32(offset, Math.floor(Date.parse(file.updatedAt) / 1000), false); offset += 4;

    // Write frame data as RGB bytes
    for (const frame of file.frames) {
      for (const row of frame) {
        for (const color of row) {
          // Convert "#RRGGBB" to RGB bytes
          const hex = color.replace('#', '');
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          view.setUint8(offset, r); offset += 1;
          view.setUint8(offset, g); offset += 1;
          view.setUint8(offset, b); offset += 1;
        }
      }
    }

    return buffer;
  }

  // Convert binary format back to LED file (matching ESP32 format)
  private convertBinaryToFile(buffer: ArrayBuffer): LEDFile {
    const view = new DataView(buffer);
    let offset = 0;

    // Read header (matching ESP32 led_file_header_t)
    const version = view.getUint8(offset); offset += 1;
    if (version !== BINARY_VERSION) {
      throw new Error('Unsupported binary version');
    }

    const rows = view.getUint8(offset); offset += 1;
    const columns = view.getUint8(offset); offset += 1;
    const totalFrames = view.getUint8(offset); offset += 1;
    const createdAt = view.getUint32(offset, false); offset += 4;
    const updatedAt = view.getUint32(offset, false); offset += 4;

    // Read frame data as RGB bytes
    const frames: string[][][] = [];
    for (let f = 0; f < totalFrames; f++) {
      const frame: string[][] = [];
      for (let r = 0; r < rows; r++) {
        const row: string[] = [];
        for (let c = 0; c < columns; c++) {
          const r_val = view.getUint8(offset); offset += 1;
          const g_val = view.getUint8(offset); offset += 1;
          const b_val = view.getUint8(offset); offset += 1;
          const hex = `#${r_val.toString(16).padStart(2, '0')}${g_val.toString(16).padStart(2, '0')}${b_val.toString(16).padStart(2, '0')}`;
          row.push(hex);
        }
        frame.push(row);
      }
      frames.push(frame);
    }

    return {
      name: 'unknown', // Will be set by caller
      rows,
      columns,
      totalFrames,
      frames,
      createdAt: new Date(createdAt * 1000).toISOString(),
      updatedAt: new Date(updatedAt * 1000).toISOString()
    };
  }

  async createFile(file: LEDFile): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const binaryFile = this.convertFileToBinary(file);
      const timeout = calculateTimeout(binaryFile.byteLength);
      console.log(`📤 Creating file: ${file.name} (${binaryFile.byteLength} bytes, timeout: ${timeout}ms)`);

      const response = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(file.name)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: binaryFile,
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('File already exists');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ File created via REST API (binary format)');
    } catch (error) {
      console.error('❌ Failed to create file via REST API:', error);
      throw error;
    }
  }

  async saveFile(file: LEDFile): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const binaryFile = this.convertFileToBinary(file);
      const timeout = calculateTimeout(binaryFile.byteLength);
      console.log(`📤 Saving file: ${file.name} (${binaryFile.byteLength} bytes, timeout: ${timeout}ms)`);

      const response = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(file.name)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: binaryFile,
        signal: AbortSignal.timeout(timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ File saved via REST API (binary format)');
    } catch (error) {
      console.error('❌ Failed to save file via REST API:', error);
      throw error;
    }
  }

  async requestFile(name: string): Promise<LEDFile | null> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(name)}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const binaryFile = await response.arrayBuffer();
      const file = this.convertBinaryToFile(binaryFile);
      file.name = name; // Set the correct name
      console.log('✅ File retrieved via REST API (binary format):', file);
      return file;
    } catch (error) {
      console.error('❌ Failed to get file via REST API:', error);
      throw error;
    }
  }

  async requestAllFiles(): Promise<LEDFile[]> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/led-files`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // For listing files, we still use JSON format for metadata
      const filesMetadata = await response.json();
      console.log('🔍 Debug: Raw response from ESP32:', filesMetadata);
      console.log('🔍 Debug: Response type:', typeof filesMetadata);
      console.log('🔍 Debug: Is array:', Array.isArray(filesMetadata));

      // Handle empty response or non-array response
      if (!Array.isArray(filesMetadata)) {
        console.warn('⚠️ ESP32 returned non-array response, returning empty array');
        return [];
      }

      // Convert metadata to full files by requesting each one
      const files: LEDFile[] = [];
      for (const metadata of filesMetadata) {
        try {
          const file = await this.requestFile(metadata.name);
          if (file) {
            files.push(file);
          }
        } catch (error) {
          console.warn(`⚠️ Failed to load file ${metadata.name}:`, error);
        }
      }

      console.log('✅ All files retrieved via REST API (binary format):', files);
      return files;
    } catch (error) {
      console.error('❌ Failed to get all files via REST API:', error);
      throw error;
    }
  }

  async deleteFile(name: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(name)}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ File deleted via REST API');
    } catch (error) {
      console.error('❌ Failed to delete file via REST API:', error);
      throw error;
    }
  }

  // Playlist methods (similar pattern)
  async savePlaylist(playlist: any): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playlist),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Playlist saved via REST API');
    } catch (error) {
      console.error('❌ Failed to save playlist via REST API:', error);
      throw error;
    }
  }

  async requestPlaylist(id: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/playlists/${id}`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const playlist = await response.json();
      console.log('✅ Playlist retrieved via REST API:', playlist);
    } catch (error) {
      console.error('❌ Failed to get playlist via REST API:', error);
      throw error;
    }
  }

  async requestAllPlaylists(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/playlists`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const playlists = await response.json();
      console.log('✅ All playlists retrieved via REST API:', playlists);
    } catch (error) {
      console.error('❌ Failed to get all playlists via REST API:', error);
      throw error;
    }
  }

  async deletePlaylist(id: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/api/playlists/${id}`, {
        method: 'DELETE',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('✅ Playlist deleted via REST API');
    } catch (error) {
      console.error('❌ Failed to delete playlist via REST API:', error);
      throw error;
    }
  }
}
