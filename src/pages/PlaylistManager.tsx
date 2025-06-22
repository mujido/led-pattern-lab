
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FilePreview } from '@/components/FilePreview';
import { storageAdapter } from '@/lib/storage-adapter';
import { playlistStorage, type Playlist, type PlaylistItem } from '@/lib/playlist-storage';
import { type LEDFile } from '@/lib/file-storage';
import { Plus, Trash2, ArrowUp, ArrowDown, Play, Save, List } from 'lucide-react';

interface PlaylistManagerProps {
  onBackToFiles: () => void;
}

export const PlaylistManager: React.FC<PlaylistManagerProps> = ({ onBackToFiles }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [availableFiles, setAvailableFiles] = useState<LEDFile[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [files, playlistData] = await Promise.all([
        storageAdapter.getAllFiles(),
        Promise.resolve(playlistStorage.getAllPlaylists())
      ]);
      setAvailableFiles(files);
      setPlaylists(playlistData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewPlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    const newPlaylist: Playlist = {
      id: playlistStorage.generateId(),
      name: newPlaylistName.trim(),
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    playlistStorage.savePlaylist(newPlaylist);
    setNewPlaylistName('');
    setShowCreateDialog(false);
    setSelectedPlaylist(newPlaylist);
    loadData();
  };

  const addFileToPlaylist = (file: LEDFile) => {
    if (!selectedPlaylist) return;

    const newItem: PlaylistItem = {
      id: playlistStorage.generateId(),
      fileId: file.id,
      fileName: file.name,
      playbackRate: 100, // Default 100ms per frame
      order: selectedPlaylist.items.length
    };

    const updatedPlaylist = {
      ...selectedPlaylist,
      items: [...selectedPlaylist.items, newItem]
    };

    playlistStorage.savePlaylist(updatedPlaylist);
    setSelectedPlaylist(updatedPlaylist);
    loadData();
  };

  const removeItemFromPlaylist = (itemId: string) => {
    if (!selectedPlaylist) return;

    const updatedPlaylist = {
      ...selectedPlaylist,
      items: selectedPlaylist.items
        .filter(item => item.id !== itemId)
        .map((item, index) => ({ ...item, order: index }))
    };

    playlistStorage.savePlaylist(updatedPlaylist);
    setSelectedPlaylist(updatedPlaylist);
    loadData();
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    if (!selectedPlaylist) return;

    const items = [...selectedPlaylist.items];
    const currentIndex = items.findIndex(item => item.id === itemId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= items.length) return;

    [items[currentIndex], items[newIndex]] = [items[newIndex], items[currentIndex]];
    items.forEach((item, index) => item.order = index);

    const updatedPlaylist = {
      ...selectedPlaylist,
      items
    };

    playlistStorage.savePlaylist(updatedPlaylist);
    setSelectedPlaylist(updatedPlaylist);
    loadData();
  };

  const updatePlaybackRate = (itemId: string, rate: number) => {
    if (!selectedPlaylist) return;

    const updatedPlaylist = {
      ...selectedPlaylist,
      items: selectedPlaylist.items.map(item =>
        item.id === itemId ? { ...item, playbackRate: rate } : item
      )
    };

    playlistStorage.savePlaylist(updatedPlaylist);
    setSelectedPlaylist(updatedPlaylist);
  };

  const deletePlaylist = (playlistId: string) => {
    playlistStorage.deletePlaylist(playlistId);
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
    }
    loadData();
  };

  const getFileById = (fileId: string) => availableFiles.find(f => f.id === fileId);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              Playlist Manager
            </h1>
            <p className="text-gray-400">Assemble LED patterns into continuous loops</p>
          </div>
          <Button onClick={onBackToFiles} variant="outline" className="border-gray-600">
            <List className="w-4 h-4 mr-2" />
            Back to Files
          </Button>
        </header>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Playlists */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Playlists</h2>
                <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-800 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Create New Playlist</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Enter a name for your new playlist.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                      <Label htmlFor="playlistname" className="text-gray-300">Playlist Name</Label>
                      <Input
                        id="playlistname"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        placeholder="My Sequence"
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        onKeyDown={(e) => e.key === 'Enter' && createNewPlaylist()}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={createNewPlaylist} disabled={!newPlaylistName.trim()}>
                        Create
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="space-y-2">
                {playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedPlaylist?.id === playlist.id
                        ? 'border-purple-500 bg-purple-900/20'
                        : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedPlaylist(playlist)}
                  >
                    <h3 className="font-medium">{playlist.name}</h3>
                    <p className="text-sm text-gray-400">{playlist.items.length} items</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Available Files */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-gray-800 border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Available Files</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableFiles.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 rounded border border-gray-600 bg-gray-700/50 hover:bg-gray-700 cursor-pointer transition-all"
                    onClick={() => addFileToPlaylist(file)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{file.name}</h3>
                        <p className="text-xs text-gray-400">
                          {file.rows}×{file.columns} • {file.totalFrames} frames
                        </p>
                      </div>
                      <FilePreview
                        frames={file.frames}
                        rows={file.rows}
                        columns={file.columns}
                        className="ml-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Playlist Editor */}
          <div className="lg:col-span-2">
            <Card className="p-4 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  {selectedPlaylist ? `Editing: ${selectedPlaylist.name}` : 'Select a Playlist'}
                </h2>
                {selectedPlaylist && (
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Deploy
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gray-800 border-gray-700">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">Delete Playlist</AlertDialogTitle>
                          <AlertDialogDescription className="text-gray-300">
                            Are you sure you want to delete "{selectedPlaylist.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deletePlaylist(selectedPlaylist.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>

              {selectedPlaylist ? (
                <div className="space-y-4">
                  {selectedPlaylist.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No items in playlist. Click on files to add them.</p>
                    </div>
                  ) : (
                    selectedPlaylist.items.map((item, index) => {
                      const file = getFileById(item.fileId);
                      if (!file) return null;

                      return (
                        <div key={item.id} className="p-4 border border-gray-600 rounded bg-gray-700/50">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveItem(item.id, 'up')}
                                disabled={index === 0}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => moveItem(item.id, 'down')}
                                disabled={index === selectedPlaylist.items.length - 1}
                                className="h-6 w-6 p-0"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                            </div>

                            <FilePreview
                              frames={file.frames}
                              rows={file.rows}
                              columns={file.columns}
                            />

                            <div className="flex-1">
                              <h3 className="font-medium">{file.name}</h3>
                              <p className="text-sm text-gray-400">
                                {file.rows}×{file.columns} • {file.totalFrames} frames
                              </p>
                              
                              <div className="mt-2">
                                <Label className="text-xs text-gray-300">
                                  Playback Rate: {item.playbackRate}ms per frame
                                </Label>
                                <Slider
                                  value={[item.playbackRate]}
                                  onValueChange={([value]) => updatePlaybackRate(item.id, value)}
                                  min={50}
                                  max={1000}
                                  step={50}
                                  className="mt-1"
                                />
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItemFromPlaylist(item.id)}
                              className="border-red-600 text-red-400 hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <List className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Select a playlist to start editing</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
