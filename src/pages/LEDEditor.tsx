
import React, { useState, useCallback, useEffect } from 'react';
import { ColorPicker } from '@/components/ColorPicker';
import { RecentColors } from '@/components/RecentColors';
import { LEDGrid } from '@/components/LEDGrid';
import { GridControls } from '@/components/GridControls';
import { AnimationControls } from '@/components/AnimationControls';
import { EditorHeader } from '@/components/EditorHeader';
import { ImportExportPanel } from '@/components/ImportExportPanel';
import { CollapsibleCard } from '@/components/CollapsibleCard';
import { Card } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertCircle } from 'lucide-react';
import { type LEDFile } from '@/lib/file-storage';
import { toast } from 'sonner';
import { storageAdapter } from '@/lib/storage-adapter';
import { useAnimationState } from '@/hooks/useAnimationState';

interface LEDEditorProps {
  fileId: string | null;
  onBackToFiles: () => void;
}

const LEDEditor: React.FC<LEDEditorProps> = ({ fileId, onBackToFiles }) => {
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [recentColors, setRecentColors] = useState(['#ff0000', '#00ff00', '#0000ff']);
  const [rows, setRows] = useState(8);
  const [columns, setColumns] = useState(16);
  const [fileName, setFileName] = useState('Untitled');

  // Single expanded panel state
  const [expandedPanel, setExpandedPanel] = useState<'grid' | 'colors' | 'animation' | 'importexport' | null>('grid');

  // LED colors for all frames
  const [ledFrames, setLedFrames] = useState<string[][][]>(() =>
    Array(8).fill(null).map(() =>
      Array(8).fill(null).map(() => Array(16).fill('#000000'))
    )
  );

  // Unsaved changes tracking
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [lastSavedState, setLastSavedState] = useState<string>('');

  // Animation state
  const {
    totalFrames,
    currentFrame,
    isPlaying,
    playbackSpeed,
    startFrame,
    endFrame,
    setTotalFrames,
    setCurrentFrame,
    setIsPlaying,
    setPlaybackSpeed,
    setStartFrame,
    setEndFrame,
    handlePlayToggle,
    handleFrameCountChange
  } = useAnimationState();

  // Load file if fileId is provided
  useEffect(() => {
    const loadFile = async () => {
      if (fileId) {
        try {
          const file = await storageAdapter.getFile(fileId);
          if (file) {
            setFileName(file.name);
            setRows(file.rows);
            setColumns(file.columns);
            setTotalFrames(file.totalFrames);
            setLedFrames(file.frames);
            setCurrentFrame(0);
            setStartFrame(0);
            setEndFrame(file.totalFrames - 1);
            
            // Set initial saved state
            const stateString = JSON.stringify({
              name: file.name,
              frames: file.frames,
              rows: file.rows,
              columns: file.columns,
              totalFrames: file.totalFrames
            });
            setLastSavedState(stateString);
            setHasUnsavedChanges(false);
          }
        } catch (error) {
          console.error('Failed to load file:', error);
        }
      } else {
        // New file defaults
        setFileName('Untitled');
        setRows(8);
        setColumns(16);
        setTotalFrames(8);
        setLedFrames(Array(8).fill(null).map(() =>
          Array(8).fill(null).map(() => Array(16).fill('#000000'))
        ));
        setCurrentFrame(0);
        setStartFrame(0);
        setEndFrame(7);
        
        // Set initial saved state for new file
        const stateString = JSON.stringify({
          name: 'Untitled',
          frames: Array(8).fill(null).map(() => Array(8).fill(null).map(() => Array(16).fill('#000000'))),
          rows: 8,
          columns: 16,
          totalFrames: 8
        });
        setLastSavedState(stateString);
        setHasUnsavedChanges(false);
      }
    };

    loadFile();
  }, [fileId, setTotalFrames, setCurrentFrame, setStartFrame, setEndFrame]);

  // Track changes to detect unsaved modifications
  useEffect(() => {
    const currentState = JSON.stringify({
      name: fileName,
      frames: ledFrames,
      rows,
      columns,
      totalFrames
    });

    setHasUnsavedChanges(currentState !== lastSavedState);
  }, [fileName, ledFrames, rows, columns, totalFrames, lastSavedState]);

  const addToRecentColors = useCallback((color: string) => {
    setRecentColors(prev => {
      const filtered = prev.filter(c => c !== color);
      return [color, ...filtered].slice(0, 12);
    });
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
    addToRecentColors(color);
  }, [addToRecentColors]);

  const handleLedClick = useCallback((row: number, col: number) => {
    setLedFrames(prev => {
      const newFrames = [...prev];
      newFrames[currentFrame] = newFrames[currentFrame].map(rowArray => [...rowArray]);
      newFrames[currentFrame][row][col] = selectedColor;
      return newFrames;
    });
  }, [selectedColor, currentFrame]);

  const handleGridSizeChange = useCallback((newRows: number, newCols: number) => {
    setRows(newRows);
    setColumns(newCols);

    setLedFrames(prev => {
      return prev.map(frame => {
        const newGrid = Array(newRows).fill(null).map(() => Array(newCols).fill('#000000'));

        for (let r = 0; r < Math.min(frame.length, newRows); r++) {
          for (let c = 0; c < Math.min(frame[r].length, newCols); c++) {
            newGrid[r][c] = frame[r][c];
          }
        }

        return newGrid;
      });
    });
  }, []);

  const clearGrid = useCallback(() => {
    setLedFrames(prev => {
      const newFrames = [...prev];
      newFrames[currentFrame] = Array(rows).fill(null).map(() => Array(columns).fill('#000000'));
      return newFrames;
    });
  }, [rows, columns, currentFrame]);

  const handleSaveFile = async () => {
    const fileData: LEDFile = {
      id: fileId || storageAdapter.generateId(),
      name: fileName,
      frames: ledFrames,
      rows,
      columns,
      totalFrames,
      createdAt: fileId ? (await storageAdapter.getFile(fileId))?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await storageAdapter.saveFile(fileData);
      toast.success('File saved successfully!');
      
      // Update saved state
      const stateString = JSON.stringify({
        name: fileName,
        frames: ledFrames,
        rows,
        columns,
        totalFrames
      });
      setLastSavedState(stateString);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save file:', error);
      toast.error('Failed to save file');
    }
  };

  const handleBackToFilesClick = () => {
    if (hasUnsavedChanges) {
      setShowExitDialog(true);
    } else {
      onBackToFiles();
    }
  };

  const handleSaveAndExit = async () => {
    await handleSaveFile();
    setShowExitDialog(false);
    onBackToFiles();
  };

  const handleDiscardAndExit = () => {
    setShowExitDialog(false);
    onBackToFiles();
  };

  const togglePanel = (panel: string) => {
    setExpandedPanel(prev => prev === panel ? null : panel as any);
  };

  const handleImport = useCallback((frames: string[][][], newRows: number, newColumns: number) => {
    setRows(newRows);
    setColumns(newColumns);
    setTotalFrames(frames.length);
    setLedFrames(frames);
    setCurrentFrame(0);
    setStartFrame(0);
    setEndFrame(frames.length - 1);
  }, [setTotalFrames, setCurrentFrame, setStartFrame, setEndFrame]);

  const wrappedHandleFrameCountChange = useCallback((newFrameCount: number) => {
    handleFrameCountChange(newFrameCount, rows, columns, setLedFrames);
  }, [handleFrameCountChange, rows, columns]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="mx-auto">
        <EditorHeader
          fileName={fileName}
          hasUnsavedChanges={hasUnsavedChanges}
          onBackToFiles={handleBackToFilesClick}
          onSave={handleSaveFile}
        />

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <CollapsibleCard 
              title="Grid Settings" 
              panelKey="grid"
              isExpanded={expandedPanel === 'grid'}
              onToggle={togglePanel}
            >
              <GridControls
                rows={rows}
                columns={columns}
                onGridSizeChange={handleGridSizeChange}
                onClearGrid={clearGrid}
              />
            </CollapsibleCard>

            <CollapsibleCard 
              title="Colors" 
              panelKey="colors"
              isExpanded={expandedPanel === 'colors'}
              onToggle={togglePanel}
            >
              <div className="space-y-6">
                <ColorPicker
                  selectedColor={selectedColor}
                  onColorChange={handleColorChange}
                />
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Colors</h3>
                  <RecentColors
                    colors={recentColors}
                    onColorSelect={setSelectedColor}
                  />
                </div>
              </div>
            </CollapsibleCard>

            <CollapsibleCard 
              title="Animation" 
              panelKey="animation"
              isExpanded={expandedPanel === 'animation'}
              onToggle={togglePanel}
            >
              <AnimationControls
                totalFrames={totalFrames}
                currentFrame={currentFrame}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                startFrame={startFrame}
                endFrame={endFrame}
                onFrameCountChange={wrappedHandleFrameCountChange}
                onCurrentFrameChange={setCurrentFrame}
                onPlayToggle={handlePlayToggle}
                onPlaybackSpeedChange={setPlaybackSpeed}
                onStartFrameChange={setStartFrame}
                onEndFrameChange={setEndFrame}
              />
            </CollapsibleCard>

            <CollapsibleCard 
              title="Import/Export" 
              panelKey="importexport"
              isExpanded={expandedPanel === 'importexport'}
              onToggle={togglePanel}
            >
              <ImportExportPanel
                fileName={fileName}
                rows={rows}
                columns={columns}
                ledFrames={ledFrames}
                onImport={handleImport}
              />
            </CollapsibleCard>
          </div>

          {/* LED Grid */}
          <div className="lg:col-span-4">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="mb-4 text-center">
                <span className="text-lg font-semibold">Frame {currentFrame + 1} of {totalFrames}</span>
              </div>
              <LEDGrid
                rows={rows}
                columns={columns}
                colors={ledFrames[currentFrame] || []}
                onLedClick={handleLedClick}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="bg-gray-800 border-gray-700 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              You have unsaved changes that will be lost if you leave without saving. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setShowExitDialog(false)}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDiscardAndExit}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Discard Changes
            </AlertDialogAction>
            <AlertDialogAction
              onClick={handleSaveAndExit}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save & Exit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LEDEditor;
