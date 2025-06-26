
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from './components/AppSidebar';
import LEDEditor from "./pages/LEDEditor";
import PlaylistEditor from "./pages/PlaylistEditor";

const App = () => {
  return (
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <SidebarProvider defaultOpen={true}>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            
            <div className="flex-1 flex flex-col">
              <header className="h-12 flex items-center border-b bg-background px-4">
                <SidebarTrigger />
                <h1 className="ml-4 text-lg font-semibold">LED Pattern Manager</h1>
              </header>
              
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Navigate to="/editor" replace />} />
                  <Route path="/editor/:fileName?" element={<LEDEditor />} />
                  <Route path="/playlist/:playlistId" element={<PlaylistEditor />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
