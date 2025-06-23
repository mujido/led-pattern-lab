import { LEDFile } from './file-storage';
import { FrameData } from './image-utils';

interface RestStorageConfig {
  baseUrl: string;
  timeout?: number;
}

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

  // Convert LED file to GIF format for storage
  private async convertFileToGif(file: LEDFile): Promise<Blob> {
    const frameData: FrameData[] = file.frames.map(frame => ({
      width: file.columns,
      height: file.rows,
      pixels: frame
    }));

    // Create a temporary canvas to generate GIF
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Use gif.js to create the GIF
    const gif = new (window as any).GIF({
      workers: 2,
      quality: 1, // Best quality (1-30, where 1 is best)
      width: file.columns, // 1:1 mapping - no scaling
      height: file.rows,
      workerScript: '/gif.worker.js',
      transparent: null, // No transparency
      background: '#000000' // Black background
    });

    // Add frames to GIF
    frameData.forEach(frame => {
      const frameCanvas = document.createElement('canvas');
      const frameCtx = frameCanvas.getContext('2d')!;
      frameCanvas.width = file.columns;
      frameCanvas.height = file.rows;

      // Draw frame data
      for (let row = 0; row < file.rows; row++) {
        for (let col = 0; col < file.columns; col++) {
          const color = frame.pixels[row][col];
          frameCtx.fillStyle = color;
          frameCtx.fillRect(col, row, 1, 1);
        }
      }

      gif.addFrame(frameCanvas, { delay: 100 });
    });

    return new Promise((resolve, reject) => {
      gif.on('finished', (blob: Blob) => resolve(blob));
      gif.on('error', reject);
      gif.render();
    });
  }

  // Generate thumbnail from LED file
  private async generateThumbnail(file: LEDFile): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Create a small thumbnail (64x64 pixels)
    const thumbnailSize = 64;
    canvas.width = thumbnailSize;
    canvas.height = thumbnailSize;

    // Use first frame for thumbnail
    const firstFrame = file.frames[0] || [];

    // Calculate scaling
    const scaleX = thumbnailSize / file.columns;
    const scaleY = thumbnailSize / file.rows;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = file.columns * scale;
    const scaledHeight = file.rows * scale;
    const offsetX = (thumbnailSize - scaledWidth) / 2;
    const offsetY = (thumbnailSize - scaledHeight) / 2;

    // Draw first frame
    for (let row = 0; row < file.rows; row++) {
      for (let col = 0; col < file.columns; col++) {
        const color = firstFrame[row]?.[col] || '#000000';
        ctx.fillStyle = color;
        ctx.fillRect(
          offsetX + col * scale,
          offsetY + row * scale,
          scale,
          scale
        );
      }
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/png');
    });
  }

  async createFile(file: LEDFile): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to REST API');
    }

    try {
      // Generate GIF and thumbnail
      const gifBlob = await this.convertFileToGif(file);
      const thumbnailBlob = await this.generateThumbnail(file);

      // Use the actual grid dimensions from the file, not the GIF metadata
      // This ensures the metadata reflects what the user actually set
      const metadata = {
        width: file.columns,
        height: file.rows,
        frameCount: file.totalFrames
      };

      console.log(`📤 Creating GIF file: ${file.name} (${gifBlob.size} bytes)`);
      console.log(`📤 Creating thumbnail: ${file.name} (${thumbnailBlob.size} bytes)`);
      console.log(`📊 Using grid dimensions: ${metadata.width}x${metadata.height}, ${metadata.frameCount} frames`);

      // Upload GIF file with metadata headers
      const gifResponse = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(file.name)}.gif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/gif',
          'X-GIF-Width': metadata.width.toString(),
          'X-GIF-Height': metadata.height.toString(),
          'X-GIF-Frames': metadata.frameCount.toString(),
        },
        body: gifBlob,
        signal: AbortSignal.timeout(calculateTimeout(gifBlob.size))
      });

      if (!gifResponse.ok) {
        if (gifResponse.status === 409) {
          throw new Error('File already exists');
        }
        throw new Error(`HTTP ${gifResponse.status}: ${gifResponse.statusText}`);
      }

      // Upload thumbnail
      const thumbResponse = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(file.name)}.thumb`, {
        method: 'POST',
        headers: {
          'Content-Type': 'image/png',
        },
        body: thumbnailBlob,
        signal: AbortSignal.timeout(calculateTimeout(thumbnailBlob.size))
      });

      if (!thumbResponse.ok) {
        console.warn('Failed to upload thumbnail, but GIF was saved successfully');
      }

      console.log('✅ File created via REST API (GIF format with thumbnail)');
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
      // Generate GIF and thumbnail
      const gifBlob = await this.convertFileToGif(file);
      const thumbnailBlob = await this.generateThumbnail(file);

      // Use the actual grid dimensions from the file, not the GIF metadata
      // This ensures the metadata reflects what the user actually set
      const metadata = {
        width: file.columns,
        height: file.rows,
        frameCount: file.totalFrames
      };

      console.log(`📤 Saving GIF file: ${file.name} (${gifBlob.size} bytes)`);
      console.log(`📤 Saving thumbnail: ${file.name} (${thumbnailBlob.size} bytes)`);
      console.log(`📊 Using grid dimensions: ${metadata.width}x${metadata.height}, ${metadata.frameCount} frames`);

      // Upload GIF file with metadata headers
      const headers = {
        'Content-Type': 'image/gif',
        'X-GIF-Width': metadata.width.toString(),
        'X-GIF-Height': metadata.height.toString(),
        'X-GIF-Frames': metadata.frameCount.toString(),
      };

      console.log('📤 Sending headers:', headers);

      const gifResponse = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(file.name)}.gif`, {
        method: 'PUT',
        headers,
        body: gifBlob,
        signal: AbortSignal.timeout(calculateTimeout(gifBlob.size))
      });

      if (!gifResponse.ok) {
        throw new Error(`HTTP ${gifResponse.status}: ${gifResponse.statusText}`);
      }

      // Upload thumbnail
      const thumbResponse = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(file.name)}.thumb`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
        },
        body: thumbnailBlob,
        signal: AbortSignal.timeout(calculateTimeout(thumbnailBlob.size))
      });

      if (!thumbResponse.ok) {
        console.warn('Failed to upload thumbnail, but GIF was saved successfully');
      }

      console.log('✅ File saved via REST API (GIF format with thumbnail)');
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
      // First get metadata from the file listing
      const metadataResponse = await fetch(`${this.config.baseUrl}/api/led-files`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!metadataResponse.ok) {
        throw new Error(`HTTP ${metadataResponse.status}: ${metadataResponse.statusText}`);
      }

      const filesMetadata = await metadataResponse.json();

      if (!Array.isArray(filesMetadata)) {
        console.warn('⚠️ ESP32 returned non-array response');
        return null;
      }

      // Find the file with matching name
      const fileMetadata = filesMetadata.find((file: any) => file.name === name);
      if (!fileMetadata) {
        console.warn(`⚠️ File ${name} not found in metadata`);
        return null;
      }

      // Now load the actual GIF file
      const gifResponse = await fetch(`${this.config.baseUrl}/api/led-files/${encodeURIComponent(name)}.gif`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      if (!gifResponse.ok) {
        throw new Error(`HTTP ${gifResponse.status}: ${gifResponse.statusText}`);
      }

      const gifBlob = await gifResponse.blob();
      console.log(`📥 Loaded GIF file: ${name} (${gifBlob.size} bytes)`);

      // Convert GIF back to LED frames
      const frames = await this.convertGifToFrames(gifBlob);

      // Convert metadata to LEDFile format with actual frames
      const file: LEDFile = {
        name: fileMetadata.name,
        rows: fileMetadata.rows || 8,
        columns: fileMetadata.columns || 8,
        totalFrames: fileMetadata.totalFrames || 1,
        frames: frames, // Use actual frames from GIF
        createdAt: new Date((fileMetadata.createdAt || 0) * 1000).toISOString(),
        updatedAt: new Date((fileMetadata.updatedAt || 0) * 1000).toISOString(),
        fileType: 'gif',
        hasThumbnail: true
      };

      console.log('✅ File loaded via REST API (GIF format):', file);
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

      // For listing files, we use JSON format for metadata
      const filesMetadata = await response.json();
      console.log('🔍 Debug: Raw response from ESP32:', filesMetadata);
      console.log('🔍 Debug: Response type:', typeof filesMetadata);
      console.log('🔍 Debug: Is array:', Array.isArray(filesMetadata));

      // Handle empty response or non-array response
      if (!Array.isArray(filesMetadata)) {
        console.warn('⚠️ ESP32 returned non-array response, returning empty array');
        return [];
      }

      // Convert metadata to LEDFile format
      const files: LEDFile[] = filesMetadata.map((metadata: any) => ({
        name: metadata.name,
        rows: metadata.rows || 8,
        columns: metadata.columns || 8,
        totalFrames: metadata.totalFrames || 1,
        frames: [], // We don't load the actual frames for listing
        createdAt: new Date((metadata.createdAt || 0) * 1000).toISOString(),
        updatedAt: new Date((metadata.updatedAt || 0) * 1000).toISOString(),
        fileType: 'gif',
        hasThumbnail: true
      }));

      console.log('✅ All files retrieved via REST API (GIF format):', files);
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

  // Convert GIF back to LED frames
  private async convertGifToFrames(gifBlob: Blob): Promise<string[][][]> {
    // Load gif-frames library if not already loaded
    if (typeof (window as any).gifFrames === 'undefined') {
      await this.loadGifFramesLibrary();
    }

    const frames: string[][][] = [];

    try {
      // Use gif-frames to extract frames from the GIF
      const extractedFrames = await (window as any).gifFrames({
        url: URL.createObjectURL(gifBlob),
        frames: 'all',
        outputType: 'canvas'
      });

      for (const frame of extractedFrames) {
        const canvas = frame.getImage();
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Convert image data to LED frame
        const ledFrame: string[][] = [];
        for (let row = 0; row < canvas.height; row++) {
          const rowData: string[] = [];
          for (let col = 0; col < canvas.width; col++) {
            const index = (row * canvas.width + col) * 4;
            const r = imageData.data[index];
            const g = imageData.data[index + 1];
            const b = imageData.data[index + 2];
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            rowData.push(hex);
          }
          ledFrame.push(rowData);
        }
        frames.push(ledFrame);
      }

      console.log(`🔄 Converted GIF to ${frames.length} LED frames`);
      return frames;
    } catch (error) {
      console.error('❌ Failed to convert GIF to frames:', error);
      throw new Error('Failed to convert GIF to LED frames');
    }
  }

  // Load gif-frames library
  private async loadGifFramesLibrary(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/gif-frames@1.0.1/dist/gif-frames.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load gif-frames library'));
      document.head.appendChild(script);
    });
  }

  // Parse GIF metadata (dimensions and frame count)
  private async parseGifMetadata(gifBlob: Blob): Promise<{width: number, height: number, frameCount: number}> {
    // Load gif-frames library if not already loaded
    if (typeof (window as any).gifFrames === 'undefined') {
      await this.loadGifFramesLibrary();
    }

    try {
      console.log('🔍 Parsing GIF metadata from blob:', gifBlob.size, 'bytes');

      // Use gif-frames to get metadata
      const frames = await (window as any).gifFrames({
        url: URL.createObjectURL(gifBlob),
        frames: 'all',
        outputType: 'canvas'
      });

      console.log('🔍 Extracted frames:', frames.length);

      if (frames.length === 0) {
        throw new Error('No frames found in GIF');
      }

      // Get dimensions from first frame
      const firstFrame = frames[0];
      const canvas = firstFrame.getImage();

      const metadata = {
        width: canvas.width,
        height: canvas.height,
        frameCount: frames.length
      };

      console.log('🔍 Parsed GIF metadata:', metadata);
      return metadata;
    } catch (error) {
      console.error('❌ Failed to parse GIF metadata:', error);
      // Fallback to default values
      const fallback = {
        width: 8,
        height: 8,
        frameCount: 1
      };
      console.log('🔍 Using fallback metadata:', fallback);
      return fallback;
    }
  }
}
