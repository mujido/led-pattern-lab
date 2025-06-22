export interface LEDFile {
  id: string;
  name: string;
  frames: string[][][];
  rows: number;
  columns: number;
  totalFrames: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'led-pattern-files';

// Keep the original localStorage implementation for backward compatibility
export const fileStorage = {
  getAllFiles(): LEDFile[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveFile(file: LEDFile): void {
    const files = this.getAllFiles();
    const existingIndex = files.findIndex(f => f.id === file.id);
    
    if (existingIndex >= 0) {
      files[existingIndex] = { ...file, updatedAt: new Date().toISOString() };
    } else {
      files.push({ ...file, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  },

  deleteFile(id: string): void {
    const files = this.getAllFiles();
    const filtered = files.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  getFile(id: string): LEDFile | null {
    const files = this.getAllFiles();
    return files.find(f => f.id === id) || null;
  },

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};
