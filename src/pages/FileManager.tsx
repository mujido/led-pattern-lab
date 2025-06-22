import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FilePreview } from '@/components/FilePreview';
import { fileStorage, type LEDFile } from '@/lib/file-storage';
import { Plus, FilePen, Trash2, Palette, List } from 'lucide-react';
import { storageAdapter } from '@/lib/storage-adapter';

interface FileManagerProps {
  onOpenFile: (fileId: string) => void;
  onCreateNew: () => void;
  onOpenPlaylists: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ onOpenFile, onCreateNew, onOpenPlaylists }) => {
  const [files, setFiles] = useState<LEDFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const loadedFiles = await storageAdapter.getAllFiles();
      setFiles(loadedFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = async () => {
    if (!newFileName.trim()) return;
    
    const newFile: LEDFile = {
      id: storageAdapter.generateId(),
      name: newFileName.trim(),
      frames: [Array(8).fill(null).map(() => Array(16).fill('#000000'))],
      rows: 8,
      columns: 16,
      totalFrames: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await storageAdapter.saveFile(newFile);
      setNewFileName('');
      setShowCreateDialog(false);
      await loadFiles();
      onOpenFile(newFile.id);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      await storageAdapter.deleteFile(fileId);
      if (selectedFile === fileId) {
        setSelectedFile(null);
      }
      await loadFiles();
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const selectedFileData = selectedFile ? files.find(f => f.id === selectedFile) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LED Pattern Files
          </h1>
          <p className="text-gray-400">Manage your LED pattern designs</p>
          <div className="flex justify-center gap-4 mt-4">
            <Button 
              onClick={onOpenPlaylists}
              className="btn-primary"
            >
              <List className="w-4 h-4 mr-2" />
              Manage Playlists
            </Button>
          </div>
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* File List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Files</h2>
                <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <AlertDialogTrigger asChild>
                    <Button className="btn-secondary">
                      <Plus className="w-4 h-4 mr-2" />
                      New File
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-800 border-gray-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-white">Create New File</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-300">
                        Enter a name for your new LED pattern file.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="my-4">
                      <Label htmlFor="filename" className="text-gray-300">File Name</Label>
                      <Input
                        id="filename"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        placeholder="My Pattern"
                        className="bg-gray-700 border-gray-600 text-white mt-1"
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleCreateNew} disabled={!newFileName.trim()} className="btn-secondary">
                        Create
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {isLoading ? (
                <div className="text-center py-12 text-gray-400">
                  <p>Loading files...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No files yet</p>
                  <p>Create your first LED pattern to get started!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedFile === file.id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 bg-gray-700/50 hover:bg-gray-700'
                      }`}
                      onClick={() => setSelectedFile(file.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{file.name}</h3>
                          <p className="text-sm text-gray-400">
                            {file.rows}×{file.columns} • {file.totalFrames} frame{file.totalFrames !== 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-gray-500">
                            Updated {new Date(file.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <FilePreview
                          frames={file.frames}
                          rows={file.rows}
                          columns={file.columns}
                          className="ml-4"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* File Actions */}
          <div className="lg:col-span-1">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              
              {selectedFileData ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <h3 className="font-semibold mb-2">{selectedFileData.name}</h3>
                    <FilePreview
                      frames={selectedFileData.frames}
                      rows={selectedFileData.rows}
                      columns={selectedFileData.columns}
                      className="mx-auto mb-4"
                    />
                    <p className="text-sm text-gray-400 mb-4">
                      {selectedFileData.rows}×{selectedFileData.columns} • {selectedFileData.totalFrames} frame{selectedFileData.totalFrames !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <Button
                    onClick={() => onOpenFile(selectedFileData.id)}
                    className="w-full btn-primary"
                  >
                    <FilePen className="w-4 h-4 mr-2" />
                    Open File
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full btn-danger border-red-800"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete File
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gray-800 border-gray-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Delete File</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-300">
                          Are you sure you want to delete "{selectedFileData.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteFile(selectedFileData.id)}
                          className="btn-danger"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Select a file to see actions</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
