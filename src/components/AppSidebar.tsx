import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Files, List, Plus, FileIcon, PlayIcon, X } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { useDataLoader } from '@/hooks/useDataLoader';
import { storageAdapter } from '@/lib/storage-adapter';
import { playlistStorageAdapter } from '@/lib/playlist-storage-adapter';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();
  const [newFileName, setNewFileName] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

  const { data: filesData, refetch: refetchFiles } = useDataLoader(
    () => storageAdapter.getAllFiles(),
    []
  );

  const { data: playlistsData, refetch: refetchPlaylists } = useDataLoader(
    () => playlistStorageAdapter.getAllPlaylists(),
    []
  );

  const files = filesData || [];
  const playlists = playlistsData || [];

  const isFileActive = (fileName: string) =>
    location.pathname === `/editor/${encodeURIComponent(fileName)}`;

  const isPlaylistActive = (playlistId: string) =>
    location.pathname === `/playlist/${playlistId}`;

  const handleFileClick = (fileName: string) => {
    navigate(`/editor/${encodeURIComponent(fileName)}`);
  };

  const handlePlaylistClick = (playlistId: string) => {
    navigate(`/playlist/${playlistId}`);
  };

  const handleCreateFile = async () => {
    if (!newFileName.trim()) return;

    try {
      const newFile = {
        name: newFileName.trim(),
        frames: [Array(16).fill(null).map(() => Array(16).fill('#000000'))],
        rows: 16,
        columns: 16,
        totalFrames: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await storageAdapter.createFile(newFile);
      await refetchFiles();
      setNewFileName('');
      setShowNewFileInput(false);
      navigate(`/editor/${encodeURIComponent(newFile.name)}`);
      toast.success('File created successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create file');
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const newPlaylist = {
        id: playlistStorageAdapter.generateId(),
        name: newPlaylistName.trim(),
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await playlistStorageAdapter.savePlaylist(newPlaylist);
      await refetchPlaylists();
      setNewPlaylistName('');
      setShowNewPlaylistInput(false);
      toast.success('Playlist created successfully');
    } catch (error) {
      toast.error('Failed to create playlist');
    }
  };

  const handleDeleteFile = async (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await storageAdapter.deleteFile(fileName);
      await refetchFiles();
      
      if (isFileActive(fileName)) {
        navigate('/editor');
      }
      
      toast.success('File deleted successfully');
    } catch (error) {
      toast.error('Failed to delete file');
    }
  };

  const handleDeletePlaylist = async (playlistId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      await playlistStorageAdapter.deletePlaylist(playlistId);
      await refetchPlaylists();
      toast.success('Playlist deleted successfully');
    } catch (error) {
      toast.error('Failed to delete playlist');
    }
  };

  return (
    <Sidebar className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Files className="w-4 h-4 mr-2" />
            {state === 'open' && 'Files'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {showNewFileInput ? (
                  <div className="flex items-center gap-2 p-2">
                    <Input
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="File name"
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateFile();
                        if (e.key === 'Escape') setShowNewFileInput(false);
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleCreateFile}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <SidebarMenuButton
                    onClick={() => setShowNewFileInput(true)}
                  >
                    <Plus className="w-4 h-4" />
                    {state === 'open' && <span>New File</span>}
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
              {files.map((file) => (
                <SidebarMenuItem key={file.name}>
                  <SidebarMenuButton
                    onClick={() => handleFileClick(file.name)}
                    isActive={isFileActive(file.name)}
                    className="group justify-between"
                  >
                    <div className="flex items-center">
                      <FileIcon className="w-4 h-4" />
                      {state === 'open' && <span className="ml-2">{file.name}</span>}
                    </div>
                    {state === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => handleDeleteFile(file.name, e)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <List className="w-4 h-4 mr-2" />
            {state === 'open' && 'Playlists'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                {showNewPlaylistInput ? (
                  <div className="flex items-center gap-2 p-2">
                    <Input
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      placeholder="Playlist name"
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreatePlaylist();
                        if (e.key === 'Escape') setShowNewPlaylistInput(false);
                      }}
                      autoFocus
                    />
                    <Button size="sm" onClick={handleCreatePlaylist}>
                      Add
                    </Button>
                  </div>
                ) : (
                  <SidebarMenuButton
                    onClick={() => setShowNewPlaylistInput(true)}
                  >
                    <Plus className="w-4 h-4" />
                    {state === 'open' && <span>New Playlist</span>}
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
              {playlists.map((playlist) => (
                <SidebarMenuItem key={playlist.id}>
                  <SidebarMenuButton 
                    onClick={() => handlePlaylistClick(playlist.id)} 
                    isActive={isPlaylistActive(playlist.id)}
                    className="group justify-between"
                  >
                    <div className="flex items-center">
                      <PlayIcon className="w-4 h-4" />
                      {state === 'open' && <span className="ml-2">{playlist.name}</span>}
                    </div>
                    {state === 'open' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
