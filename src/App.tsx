
import React, { useState } from 'react';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileManager } from './pages/FileManager';
import { PlaylistManager } from './pages/PlaylistManager';
import LEDEditor from "./pages/LEDEditor";

const App = () => {
  const [currentView, setCurrentView] = useState<'files' | 'editor' | 'playlists'>('files');
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  const handleOpenFile = (fileId: string) => {
    setCurrentFileId(fileId);
    setCurrentView('editor');
  };

  const handleCreateNew = () => {
    setCurrentFileId(null);
    setCurrentView('editor');
  };

  const handleBackToFiles = () => {
    setCurrentView('files');
    setCurrentFileId(null);
  };

  const handleOpenPlaylists = () => {
    setCurrentView('playlists');
  };

  return (
    <TooltipProvider>
      <Sonner />
      {currentView === 'files' ? (
        <FileManager 
          onOpenFile={handleOpenFile}
          onCreateNew={handleCreateNew}
          onOpenPlaylists={handleOpenPlaylists}
        />
      ) : currentView === 'playlists' ? (
        <PlaylistManager 
          onBackToFiles={handleBackToFiles}
        />
      ) : (
        <LEDEditor 
          fileId={currentFileId}
          onBackToFiles={handleBackToFiles}
        />
      )}
    </TooltipProvider>
  );
};

export default App;
