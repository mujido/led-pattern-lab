import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Files, List, Plus, FileIcon, PlayIcon } from 'lucide-react';
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

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useSidebar();

  const { data: filesData } = useDataLoader(
    () => storageAdapter.getAllFiles(),
    []
  );

  const { data: playlistsData } = useDataLoader(
    () => playlistStorageAdapter.getAllPlaylists(),
    []
  );

  // Ensure we have arrays, not null
  const files = filesData || [];
  const playlists = playlistsData || [];

  const isActive = (path: string) => location.pathname === path;
  const isFileActive = (fileName: string) =>
    location.pathname === `/editor/${encodeURIComponent(fileName)}`;

  const handleFileClick = (fileName: string) => {
    navigate(`/editor/${encodeURIComponent(fileName)}`);
  };

  const handlePlaylistClick = () => {
    navigate('/playlists');
  };

  const handleNewFile = () => {
    navigate('/files');
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
                <SidebarMenuButton
                  onClick={handleNewFile}
                  isActive={isActive('/files')}
                >
                  <Plus className="w-4 h-4" />
                  {state === 'open' && <span>Manage Files</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {files.map((file) => (
                <SidebarMenuItem key={file.name}>
                  <SidebarMenuButton
                    onClick={() => handleFileClick(file.name)}
                    isActive={isFileActive(file.name)}
                  >
                    <FileIcon className="w-4 h-4" />
                    {state === 'open' && <span>{file.name}</span>}
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
                <SidebarMenuButton
                  onClick={handlePlaylistClick}
                  isActive={isActive('/playlists')}
                >
                  <PlayIcon className="w-4 h-4" />
                  {state === 'open' && <span>Manage Playlists</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              {playlists.map((playlist) => (
                <SidebarMenuItem key={playlist.id}>
                  <SidebarMenuButton
                    onClick={handlePlaylistClick}
                    isActive={isActive('/playlists')}
                  >
                    <List className="w-4 h-4" />
                    {state === 'open' && <span>{playlist.name}</span>}
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
