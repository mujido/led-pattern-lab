
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FilePreview } from '@/components/FilePreview';
import { fileStorage, type LEDFile } from '@/lib/file-storage';
import { loadGif, loadPng, detectFileType, type FrameData } from '@/lib/image-utils';
import { Plus, FilePen, Trash2, Palette, Upload, AlertCircle } from 'lucide-react';

interface FileManagerProps {
  onOpenFile: (fileId: string) => void;
  onCreateNew: () => void;
}

export const FileManager: React.FC<FileManagerProps> = ({ onOpenFile, onCreateNew }) => {
  const [files, setFiles] = useState<LEDFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCumulative, setUseCumulative] = useState(true);
  const [importRows, setImportRows] = useState(8);
  const [importColumns, setImportColumns] = useState(16);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    setFiles(fileStorage.getAllFiles());
  };

  const handleCreateNew = () => {
    if (!newFileName.trim()) return;
    
    const newFile: LEDFile = {
      id: fileStorage.generateId(),
      name: newFileName.trim(),
      frames: [Array(8).fill(null).map(() => Array(16).fill('#000000'))],
      rows: 8,
      columns: 16,
      totalFrames: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fileStorage.saveFile(newFile);
    setNewFileName('');
    setShowCreateDialog(false);
    loadFiles();
    onOpenFile(newFile.id);
  };

  const handleDeleteFile = (fileId: string) => {
    fileStorage.deleteFile(fileId);
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
    loadFiles();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const fileType = detectFileType(file);

      if (fileType === 'unknown') {
        throw new Error('Unsupported file type. Please use GIF or PNG files.');
      }

      let frameData: FrameData[];

      if (fileType === 'gif') {
        const result = await loadGif(file, importColumns, importRows, useCumulative);
        frameData = result.frames;
      } else {
        const result = await loadPng(file, importColumns, importRows);
        frameData = result.frames;
      }

      if (frameData.length === 0) {
        throw new Error('No frames found in the file.');
      }

      const frames: string[][][] = frameData.map(frame => frame.pixels);
      const baseName = file.name.replace(/\.[^/.]+$/, '');

      // Create new file from imported data
      const newFile: LEDFile = {
        id: fileStorage.generateId(),
        name: baseName,
        frames: frames,
        rows: importRows,
        columns: importColumns,
        totalFrames: frames.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      fileStorage.saveFile(newFile);
      loadFiles();
      onOpenFile(newFile.id);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
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
        </header>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* File List */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Files</h2>
                <div className="flex gap-2">
                  <Button
                    onClick={handleLoadClick}
                    variant="outline"
                    disabled={isLoading}
                    className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isLoading ? 'Importing...' : 'Import GIF/PNG'}
                  </Button>
                  <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <AlertDialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
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
                        <AlertDialogAction onClick={handleCreateNew} disabled={!newFileName.trim()}>
                          Create
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Import Settings */}
              <div className="mb-4 p-4 bg-gray-700/50 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 text-gray-300">Import Settings</h3>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <Label htmlFor="import-rows" className="text-xs text-gray-400">Rows</Label>
                    <Input
                      id="import-rows"
                      type="number"
                      min="1"
                      max="32"
                      value={importRows}
                      onChange={(e) => setImportRows(parseInt(e.target.value) || 8)}
                      className="bg-gray-700 border-gray-600 text-white text-sm mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="import-columns" className="text-xs text-gray-400">Columns</Label>
                    <Input
                      id="import-columns"
                      type="number"
                      min="1"
                      max="64"
                      value={importColumns}
                      onChange={(e) => setImportColumns(parseInt(e.target.value) || 16)}
                      className="bg-gray-700 border-gray-600 text-white text-sm mt-1"
                    />
                  </div>
                </div>
                <div className="items-top flex space-x-2">
                  <Checkbox id="cumulative" checked={useCumulative} onCheckedChange={(checked) => setUseCumulative(Boolean(checked))} />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="cumulative"
                      className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
                    >
                      GIF is optimized (layers frames)
                    </label>
                    <p className="text-xs text-gray-500">
                      Uncheck if your GIF has ghosting or artifacts.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-900/20 border border-red-800 rounded mb-4">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {files.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg mb-2">No files yet</p>
                  <p>Create your first LED pattern or import a GIF/PNG to get started!</p>
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

              <input
                ref={fileInputRef}
                type="file"
                accept=".gif,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
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
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <FilePen className="w-4 h-4 mr-2" />
                    Open File
                  </Button>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-red-900/20 border-red-800 text-red-400 hover:bg-red-900/40"
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
                          className="bg-red-600 hover:bg-red-700"
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
