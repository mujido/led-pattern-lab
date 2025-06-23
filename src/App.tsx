import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FileManager } from './pages/FileManager';
import { PlaylistManager } from './pages/PlaylistManager';
import LEDEditor from "./pages/LEDEditor";

const App = () => {
  return (
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/files" replace />} />
          <Route path="/files" element={<FileManager />} />
          <Route path="/editor/:fileName?" element={<LEDEditor />} />
          <Route path="/playlists" element={<PlaylistManager />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
