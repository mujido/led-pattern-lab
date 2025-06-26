import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { List, ListItem } from '@/components/ui/list';
import { PageLayout } from '@/components/ui/page-layout';
import { PageHeader } from '@/components/ui/page-header';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FilePreview } from '@/components/FilePreview';
import { StorageUsageIndicator } from '@/components/StorageUsageIndicator';
import { type LEDFile } from '@/lib/file-storage';
import { Plus, FilePen, Trash2, Palette, List as ListIcon, RotateCcw, Edit, Play, Download, Upload, Settings } from 'lucide-react';
import { storageAdapter } from '@/lib/storage-adapter';
import { useDataLoader } from '@/hooks/useDataLoader';
import { toast } from 'sonner';
import { getRestApiUrl } from '@/lib/mode-detector';

export const FileManager: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const baseUrl = getRestApiUrl();

  // Use proper data loading pattern
  const { data: files = [], loading, error, refetch } = useDataLoader(
    () => storageAdapter.getAllFiles(),
    []
  );

  // Ensure files is always an array
  const safeFiles = Array.isArray(files) ? files : [];

  const handleCreateNew = async () => {
    if (!newFileName.trim()) return;

    // Use clean name without extension - ESP32 handles .led internally
    const fileName = newFileName.trim();

    const newFile: LEDFile = {
      name: fileName,
      frames: [Array(8).fill(null).map(() => Array(16).fill('#000000'))],
      rows: 8,
      columns: 16,
      totalFrames: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await storageAdapter.createFile(newFile);
      setNewFileName('');
      setShowCreateDialog(false);
      await refetch(); // Refresh the data
      navigate(`/editor/${encodeURIComponent(newFile.name)}`);
    } catch (error) {
      console.error('Failed to create file:', error);
    }
  };

  const handleDeleteFile = async (fileName: string) => {
    try {
      await storageAdapter.deleteFile(fileName);
      if (selectedFile === fileName) {
        setSelectedFile(null);
      }
      await refetch(); // Refresh the data
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleOpenFile = (fileName: string) => {
    navigate(`/editor/${encodeURIComponent(fileName)}`);
  };

  const handleOpenPlaylists = () => {
    navigate('/playlists');
  };

  const handleResetMetadata = async () => {
    try {
      await storageAdapter.resetMetadata();
      toast.success('Metadata system reset successfully. Please refresh the page.');
      // Refresh the data after a short delay
      setTimeout(() => {
        refetch();
      }, 1000);
    } catch (error) {
      console.error('Failed to reset metadata:', error);
      toast.error('Failed to reset metadata system');
    }
  };

  const selectedFileData = selectedFile ? safeFiles.find(f => f.name === selectedFile) : null;

  return (
    <PageLayout>
      <PageHeader
        title="LED Pattern Files"
        description="Manage your LED pattern designs"
        actions={
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleOpenPlaylists}
              className="btn-primary"
            >
              <ListIcon className="w-4 h-4 mr-2" />
              Manage Playlists
            </Button>
          </div>
        }
      />

      {/* Storage Usage Indicator */}
      <div className="mb-6">
        <StorageUsageIndicator files={safeFiles} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
              <p className="text-red-300">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                className="border-red-700 text-red-300 hover:bg-red-800/20"
              >
                Retry
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* File List */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Your Files</h2>
              <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <AlertDialogTrigger asChild>
                  <Button className="btn-secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    New File
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Create New File</AlertDialogTitle>
                    <AlertDialogDescription>
                      Enter a name for your new LED pattern file.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="my-4">
                    <Label htmlFor="filename">File Name</Label>
                    <Input
                      id="filename"
                      value={newFileName}
                      onChange={(e) => setNewFileName(e.target.value)}
                      placeholder="My Pattern"
                      className="mt-1"
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleCreateNew} disabled={!newFileName.trim()} className="btn-secondary">
                      Create
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Loading files...</p>
              </div>
            ) : safeFiles.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No files yet</p>
                <p>Create your first LED pattern to get started!</p>
              </div>
            ) : (
              <List>
                {safeFiles.map((file) => (
                  <ListItem
                    key={file.name}
                    className={selectedFile === file.name ? "border-blue-500 bg-blue-900/20" : "cursor-pointer"}
                    onClick={() => setSelectedFile(file.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {file.rows}×{file.columns} • {file.totalFrames} frame{file.totalFrames !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          Updated {new Date(file.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <FilePreview
                        frames={file.frames}
                        rows={file.rows}
                        columns={file.columns}
                        fileName={file.name}
                        baseUrl={baseUrl}
                        className="ml-4"
                      />
                    </div>
                  </ListItem>
                ))}
              </List>
            )}
          </Card>
        </div>

        {/* File Actions */}
        <div className="lg:col-span-1">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>

            {selectedFileData ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">{selectedFileData.name}</h3>
                  <FilePreview
                    frames={selectedFileData.frames}
                    rows={selectedFileData.rows}
                    columns={selectedFileData.columns}
                    fileName={selectedFileData.name}
                    baseUrl={baseUrl}
                    className="mx-auto mb-4"
                  />
                  <p className="text-sm text-muted-foreground">
                    {selectedFileData.rows}×{selectedFileData.columns} • {selectedFileData.totalFrames} frame{selectedFileData.totalFrames !== 1 ? 's' : ''}
                  </p>
                </div>

                <Button
                  onClick={() => handleOpenFile(selectedFileData.name)}
                  className="w-full btn-primary"
                >
                  <FilePen className="w-4 h-4 mr-2" />
                  Open File
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full btn-danger"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete File
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete File</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{selectedFileData.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDeleteFile(selectedFileData.name)}
                        className="btn-danger"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select a file to see actions</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};
