import React, { useState, useCallback, useEffect } from 'react';
import { ColorPicker } from '@/components/ColorPicker';
import { RecentColors } from '@/components/RecentColors';
import { LEDGrid } from '@/components/LEDGrid';
import { GridControls } from '@/components/GridControls';
import { AnimationControls } from '@/components/AnimationControls';
import { GifControls } from '@/components/GifControls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { fileStorage, type LEDFile } from '@/lib/file-storage';
import { toast } from 'sonner';

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
  const [expandedPanel, setExpandedPanel] = useState<'grid' | 'animation' | 'export' | 'colorPicker' | 'recentColors' | null>('grid');

  // Animation state
  const [totalFrames, setTotalFrames] = useState(8);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(7);

  // LED colors for all frames
  const [ledFrames, setLedFrames] = useState<string[][][]>(() =>
    Array(8).fill(null).map(() =>
      Array(8).fill(null).map(() => Array(16).fill('#000000'))
    )
  );

  // Load file if fileId is provided
  useEffect(() => {
    if (fileId) {
      const file = fileStorage.getFile(fileId);
      if (file) {
        setFileName(file.name);
        setRows(file.rows);
        setColumns(file.columns);
        setTotalFrames(file.totalFrames);
        setLedFrames(file.frames);
        setCurrentFrame(0);
        setStartFrame(0);
        setEndFrame(file.totalFrames - 1);
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
    }
  }, [fileId]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        return next > endFrame ? startFrame : next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, startFrame, endFrame]);

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

  const handleFrameCountChange = useCallback((newFrameCount: number) => {
    setTotalFrames(newFrameCount);
    setLedFrames(prev => {
      if (newFrameCount > prev.length) {
        const newFrames = [...prev];
        for (let i = prev.length; i < newFrameCount; i++) {
          newFrames.push(Array(rows).fill(null).map(() => Array(columns).fill('#000000')));
        }
        return newFrames;
      } else {
        return prev.slice(0, newFrameCount);
      }
    });

    if (currentFrame >= newFrameCount) {
      setCurrentFrame(newFrameCount - 1);
    }

    if (endFrame >= newFrameCount) {
      setEndFrame(newFrameCount - 1);
    }
    if (startFrame >= newFrameCount) {
      setStartFrame(0);
    }
  }, [rows, columns, currentFrame, endFrame, startFrame]);

  const handleSaveFrames = useCallback(() => {
    return ledFrames;
  }, [ledFrames]);

  const handleSaveFile = () => {
    const fileData: LEDFile = {
      id: fileId || fileStorage.generateId(),
      name: fileName,
      frames: ledFrames,
      rows,
      columns,
      totalFrames,
      createdAt: fileId ? fileStorage.getFile(fileId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    fileStorage.saveFile(fileData);
    toast.success('File saved successfully!');
  };

  const togglePanel = (panel: 'grid' | 'animation' | 'export' | 'colorPicker' | 'recentColors') => {
    setExpandedPanel(prev => prev === panel ? null : panel);
  };

  const CollapsibleCard = ({ 
    title, 
    panelKey, 
    children 
  }: { 
    title: string; 
    panelKey: 'grid' | 'animation' | 'export' | 'colorPicker' | 'recentColors'; 
    children: React.ReactNode;
  }) => {
    const isExpanded = expandedPanel === panelKey;
    const Icon = isExpanded ? ChevronUp : ChevronDown;

    return (
      <Card className="bg-gray-800 border-gray-700">
        <button
          onClick={() => togglePanel(panelKey)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
        >
          <h2 className="text-xl font-semibold">{title}</h2>
          <Icon className="w-5 h-5" />
        </button>
        {isExpanded && (
          <div className="px-4 pb-4">
            {children}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="mx-auto">
        <header className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              onClick={onBackToFiles}
              variant="outline"
              className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Files
            </Button>
            <Button
              onClick={handleSaveFile}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {fileName}
          </h1>
          <p className="text-gray-400">Design beautiful animated patterns for your LED matrix</p>
        </header>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <CollapsibleCard title="Grid Settings" panelKey="grid">
              <GridControls
                rows={rows}
                columns={columns}
                onGridSizeChange={handleGridSizeChange}
                onClearGrid={clearGrid}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Animation" panelKey="animation">
              <AnimationControls
                totalFrames={totalFrames}
                currentFrame={currentFrame}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                startFrame={startFrame}
                endFrame={endFrame}
                onFrameCountChange={handleFrameCountChange}
                onCurrentFrameChange={setCurrentFrame}
                onPlayToggle={() => setIsPlaying(!isPlaying)}
                onPlaybackSpeedChange={setPlaybackSpeed}
                onStartFrameChange={setStartFrame}
                onEndFrameChange={setEndFrame}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Export Tools" panelKey="export">
              <GifControls
                onSaveFrames={handleSaveFrames}
                currentRows={rows}
                currentColumns={columns}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Color Picker" panelKey="colorPicker">
              <ColorPicker
                selectedColor={selectedColor}
                onColorChange={handleColorChange}
              />
            </CollapsibleCard>

            <CollapsibleCard title="Recent Colors" panelKey="recentColors">
              <RecentColors
                colors={recentColors}
                onColorSelect={setSelectedColor}
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
    </div>
  );
};

export default LEDEditor;
