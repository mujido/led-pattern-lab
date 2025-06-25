import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { List, ListItem } from '@/components/ui/list';
import { PageLayout } from '@/components/ui/page-layout';
import { PageHeader } from '@/components/ui/page-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Plus, Play, Trash2, Edit, Save, X } from 'lucide-react';
import { playlistStorageAdapter } from '@/lib/playlist-storage-adapter';
import { type Playlist } from '@/lib/playlist-storage';
import { storageAdapter } from '@/lib/storage-adapter';
import { type LEDFile } from '@/lib/file-storage';
import { toast } from 'sonner';

export const PlaylistManager: React.FC = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [files, setFiles] = useState<LEDFile[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [playlistData, fileData] = await Promise.all([
        playlistStorageAdapter.getAllPlaylists(),
        storageAdapter.getAllFiles()
      ]);
      setPlaylists(playlistData);
      setFiles(fileData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const newPlaylist: Playlist = {
        id: playlistStorageAdapter.generateId(),
        name: newPlaylistName.trim(),
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await playlistStorageAdapter.savePlaylist(newPlaylist);
      setPlaylists(prev => [...prev, newPlaylist]);
      setNewPlaylistName('');
      setShowCreateDialog(false);
      toast.success('Playlist created successfully!');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist');
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    try {
      await playlistStorageAdapter.deletePlaylist(id);
      setPlaylists(prev => prev.filter(p => p.id !== id));
      toast.success('Playlist deleted successfully!');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  const handleRenamePlaylist = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      const playlist = playlists.find(p => p.id === id);
      if (!playlist) return;

      const updatedPlaylist = {
        ...playlist,
        name: editingName.trim(),
        updatedAt: new Date().toISOString()
      };

      await playlistStorageAdapter.savePlaylist(updatedPlaylist);
      setPlaylists(prev => prev.map(p => p.id === id ? updatedPlaylist : p));
      setEditingId(null);
      setEditingName('');
      toast.success('Playlist renamed successfully!');
    } catch (error) {
      console.error('Failed to rename playlist:', error);
      toast.error('Failed to rename playlist');
    }
  };

  const handleAddFileToPlaylist = async (playlistId: string, fileName: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      const file = files.find(f => f.name === fileName);
      if (!playlist || !file || playlist.items.some(item => item.fileId === fileName)) return;

      const newItem = {
        id: playlistStorageAdapter.generateId(),
        fileId: fileName,
        fileName: file.name,
        playbackRate: 100, // Default 100ms per frame
        order: playlist.items.length
      };

      const updatedPlaylist = {
        ...playlist,
        items: [...playlist.items, newItem],
        updatedAt: new Date().toISOString()
      };

      await playlistStorageAdapter.savePlaylist(updatedPlaylist);
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
      toast.success('File added to playlist!');
    } catch (error) {
      console.error('Failed to add file to playlist:', error);
      toast.error('Failed to add file to playlist');
    }
  };

  const handleRemoveFileFromPlaylist = async (playlistId: string, fileName: string) => {
    try {
      const playlist = playlists.find(p => p.id === playlistId);
      if (!playlist) return;

      const updatedPlaylist = {
        ...playlist,
        items: playlist.items.filter(item => item.fileId !== fileName),
        updatedAt: new Date().toISOString()
      };

      await playlistStorageAdapter.savePlaylist(updatedPlaylist);
      setPlaylists(prev => prev.map(p => p.id === playlistId ? updatedPlaylist : p));
      toast.success('File removed from playlist!');
    } catch (error) {
      console.error('Failed to remove file from playlist:', error);
      toast.error('Failed to remove file from playlist');
    }
  };

  const getFileName = (fileId: string) => {
    const file = files.find(f => f.name === fileId);
    return file ? file.name : 'Unknown File';
  };

  const startEditing = (playlist: Playlist) => {
    setEditingId(playlist.id);
    setEditingName(playlist.name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName('');
  };

  return (
    <PageLayout>
      <PageHeader
        title="Playlist Manager"
        description="Create and manage playlists for your LED animations"
        backButton={{
          onClick: () => navigate('/files')
        }}
      />

      <div className="grid gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Playlists</h2>
            <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <AlertDialogTrigger asChild>
                <Button className="">
                  <Plus className="w-4 h-4 mr-2" />
                  New Playlist
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Create New Playlist</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter a name for your new playlist.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="playlist-name" className="text-sm text-gray-300">
                    Playlist Name
                  </Label>
                  <Input
                    id="playlist-name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Enter playlist name..."
                    className="mt-2 bg-gray-700 border-gray-600 text-white"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newPlaylistName.trim()) {
                        handleCreatePlaylist();
                      }
                    }}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleCreatePlaylist}
                    disabled={!newPlaylistName.trim()}
                    className="btn-secondary"
                  >
                    Create
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No playlists yet</p>
              <p>Create your first playlist to get started!</p>
            </div>
          ) : (
            <List>
              {playlists.map((playlist) => (
                <ListItem key={playlist.id}>
                  <div className="flex items-center justify-between mb-3">
                    {editingId === playlist.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="bg-gray-600 border-gray-500 text-white"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRenamePlaylist(playlist.id);
                            } else if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          onClick={() => handleRenamePlaylist(playlist.id)}
                          size="sm"
                          className="btn-primary"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={cancelEditing}
                          size="sm"
                          variant="outline"
                          className="border-gray-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{playlist.name}</h3>
                          <p className="text-sm text-gray-400">
                            {playlist.items.length} file{playlist.items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => startEditing(playlist)}
                            size="sm"
                            variant="outline"
                            className="border-gray-500"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="btn-danger border-red-800"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePlaylist(playlist.id)}
                                  className="btn-danger"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Files in this playlist:</h4>
                    {playlist.items.length === 0 ? (
                      <p className="text-sm text-gray-500">No files added yet</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {playlist.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 bg-gray-600 px-3 py-1 rounded-full text-sm"
                          >
                            <span>{item.fileName}</span>
                            <button
                              onClick={() => handleRemoveFileFromPlaylist(playlist.id, item.fileId)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">Add files:</h5>
                      <div className="flex flex-wrap gap-2">
                        {files
                          .filter((file) => !playlist.items.some(item => item.fileId === file.name))
                          .map((file) => (
                            <Button
                              key={file.name}
                              onClick={() => handleAddFileToPlaylist(playlist.id, file.name)}
                              size="sm"
                              variant="outline"
                              className="text-xs border-gray-500 hover:bg-gray-600"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              {file.name}
                            </Button>
                          ))}
                      </div>
                      {files.filter((file) => !playlist.items.some(item => item.fileId === file.name)).length === 0 && (
                        <p className="text-xs text-gray-500">All files are already in this playlist</p>
                      )}
                    </div>
                  </div>
                </ListItem>
              ))}
            </List>
          )}
        </Card>
      </div>
    </PageLayout>
  );
};
