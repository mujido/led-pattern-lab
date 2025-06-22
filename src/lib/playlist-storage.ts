
export interface PlaylistItem {
  id: string;
  fileId: string;
  fileName: string;
  playbackRate: number; // milliseconds per frame
  order: number;
}

export interface Playlist {
  id: string;
  name: string;
  items: PlaylistItem[];
  createdAt: string;
  updatedAt: string;
}

const PLAYLIST_STORAGE_KEY = 'led-pattern-playlists';

export const playlistStorage = {
  getAllPlaylists(): Playlist[] {
    try {
      const stored = localStorage.getItem(PLAYLIST_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  savePlaylist(playlist: Playlist): void {
    const playlists = this.getAllPlaylists();
    const existingIndex = playlists.findIndex(p => p.id === playlist.id);
    
    if (existingIndex >= 0) {
      playlists[existingIndex] = { ...playlist, updatedAt: new Date().toISOString() };
    } else {
      playlists.push({ ...playlist, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(playlists));
  },

  deletePlaylist(id: string): void {
    const playlists = this.getAllPlaylists();
    const filtered = playlists.filter(p => p.id !== id);
    localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(filtered));
  },

  getPlaylist(id: string): Playlist | null {
    const playlists = this.getAllPlaylists();
    return playlists.find(p => p.id === id) || null;
  },

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};
