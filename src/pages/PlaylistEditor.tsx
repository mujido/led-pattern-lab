
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, GripVertical, X, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { FilePreview } from '@/components/FilePreview';
import { useDataLoader } from '@/hooks/useDataLoader';
import { playlistStorageAdapter } from '@/lib/playlist-storage-adapter';
import { storageAdapter } from '@/lib/storage-adapter';
import { toast } from 'sonner';
import type { Playlist, PlaylistItem } from '@/lib/playlist-storage';

export default function PlaylistEditor() {
  const { playlistId } = useParams<{ playlistId: string }>();
  const navigate = useNavigate();
  const [playlistName, setPlaylistName] = useState('');
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  const { data: playlist, refetch: refetchPlaylist } = useDataLoader(
    () => playlistId ? playlistStorageAdapter.getPlaylist(playlistId) : Promise.resolve(null),
    [playlistId]
  );

  const { data: allFiles } = useDataLoader(
    () => storageAdapter.getAllFiles(),
    []
  );

  useEffect(() => {
    if (playlist) {
      setPlaylistName(playlist.name);
      setPlaylistItems(playlist.items.sort((a, b) => a.order - b.order));
    }
  }, [playlist]);

  const availableFiles = (allFiles || []).filter(file => 
    !playlistItems.some(item => item.fileName === file.name) &&
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!playlistId) return;
    
    try {
      const updatedPlaylist: Playlist = {
        id: playlistId,
        name: playlistName,
        items: playlistItems,
        createdAt: playlist?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await playlistStorageAdapter.savePlaylist(updatedPlaylist);
      toast.success('Playlist saved successfully');
    } catch (error) {
      toast.error('Failed to save playlist');
    }
  };

  const handleAddToPlaylist = (fileName: string) => {
    const newItem: PlaylistItem = {
      id: playlistStorageAdapter.generateId(),
      fileId: fileName,
      fileName,
      playbackRate: 100,
      order: playlistItems.length,
    };

    setPlaylistItems([...playlistItems, newItem]);
    toast.success(`Added ${fileName} to playlist`);
  };

  const handleRemoveFromPlaylist = (itemId: string) => {
    const updatedItems = playlistItems
      .filter(item => item.id !== itemId)
      .map((item, index) => ({ ...item, order: index }));
    
    setPlaylistItems(updatedItems);
    toast.success('Removed from playlist');
  };

  const handlePlaybackRateChange = (itemId: string, newRate: number) => {
    setPlaylistItems(items =>
      items.map(item =>
        item.id === itemId ? { ...item, playbackRate: Math.max(10, Math.min(1000, newRate)) } : item
      )
    );
  };

  const handleDragStart = (index: number) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const items = [...playlistItems];
    const draggedItemData = items[draggedItem];
    items.splice(draggedItem, 1);
    items.splice(index, 0, draggedItemData);

    // Update order values
    items.forEach((item, idx) => {
      item.order = idx;
    });

    setPlaylistItems(items);
    setDraggedItem(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const moveItem = (fromIndex: number, direction: 'up' | 'down') => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= playlistItems.length) return;

    const items = [...playlistItems];
    [items[fromIndex], items[toIndex]] = [items[toIndex], items[fromIndex]];
    
    // Update order values
    items.forEach((item, idx) => {
      item.order = idx;
    });

    setPlaylistItems(items);
  };

  if (!playlist && playlistId) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-400">Playlist not found</h1>
        <Button onClick={() => navigate('/')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-7xl mx-auto">
        <PageHeader
          title="Edit Playlist"
          backButton={{
            onClick: () => navigate('/')
          }}
          actionButton={{
            label: 'Save Playlist',
            onClick: handleSave,
            icon: <Save className="w-4 h-4 mr-2" />,
          }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Playlist Editor - Left Side */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Playlist Name</label>
                  <Input
                    value={playlistName}
                    onChange={(e) => setPlaylistName(e.target.value)}
                    placeholder="Enter playlist name"
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    Playlist Items ({playlistItems.length})
                  </h3>
                  
                  {playlistItems.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="text-4xl mb-4">🎬</div>
                      <p>No items in playlist yet</p>
                      <p className="text-sm">Add files from the gallery on the right</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {playlistItems.map((item, index) => {
                        const file = allFiles?.find(f => f.name === item.fileName);
                        return (
                          <div
                            key={item.id}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`bg-muted rounded-lg p-4 border transition-all duration-200 cursor-move hover:bg-accent ${
                              draggedItem === index ? 'opacity-50 scale-95' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              
                              <div className="w-16 h-16 flex-shrink-0">
                                {file && (
                                  <FilePreview
                                    frames={file.frames}
                                    rows={file.rows}
                                    columns={file.columns}
                                    className="w-full h-full"
                                  />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium truncate">{item.fileName}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {file?.totalFrames || 1} frame{(file?.totalFrames || 1) !== 1 ? 's' : ''}
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium whitespace-nowrap">Frame Rate:</label>
                                <Input
                                  type="number"
                                  value={item.playbackRate}
                                  onChange={(e) => handlePlaybackRateChange(item.id, parseInt(e.target.value) || 100)}
                                  className="w-20 text-center"
                                  min="10"
                                  max="1000"
                                />
                                <span className="text-xs text-muted-foreground">ms</span>
                              </div>

                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveItem(index, 'up')}
                                  disabled={index === 0}
                                  className="h-8 w-8 p-0"
                                >
                                  ↑
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => moveItem(index, 'down')}
                                  disabled={index === playlistItems.length - 1}
                                  className="h-8 w-8 p-0"
                                >
                                  ↓
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFromPlaylist(item.id)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Available Files Gallery - Right Side */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-3">Available Files</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search files..."
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableFiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="text-2xl mb-2">📁</div>
                      <p className="text-sm">
                        {searchTerm ? 'No files match your search' : 'No available files'}
                      </p>
                    </div>
                  ) : (
                    availableFiles.map((file) => (
                      <div
                        key={file.name}
                        className="bg-background border rounded-lg p-3 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 flex-shrink-0">
                            <FilePreview
                              frames={file.frames}
                              rows={file.rows}
                              columns={file.columns}
                              className="w-full h-full"
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{file.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {file.totalFrames} frame{file.totalFrames !== 1 ? 's' : ''}
                            </p>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => handleAddToPlaylist(file.name)}
                            className="flex-shrink-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
