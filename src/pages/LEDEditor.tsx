
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ColorPicker } from '@/components/ColorPicker';
import { RecentColors } from '@/components/RecentColors';
import { LEDGrid } from '@/components/LEDGrid';
import { GridControls } from '@/components/GridControls';
import { AnimationControls } from '@/components/AnimationControls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, ChevronDown, ChevronUp, Upload, AlertCircle, Download, FileImage } from 'lucide-react';
import { fileStorage, type LEDFile } from '@/lib/file-storage';
import { loadGif, loadPng, detectFileType, saveAsGif, saveAsPng, type FrameData } from '@/lib/image-utils';
import { toast } from 'sonner';

interface LEDEditorProps {
  fileId: string | null;
  onBackToFiles: () => void;
}

const presetResolutions = [
  { label: '8×32', rows: 8, columns: 32 },
  { label: '32×32', rows: 32, columns: 32 },
  { label: '64×64', rows: 64, columns: 64 },
  { label: 'Custom', rows: -1, columns: -1 }
];

const LEDEditor: React.FC<LEDEditorProps> = ({ fileId, onBackToFiles }) => {
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [recentColors, setRecentColors] = useState(['#ff0000', '#00ff00', '#0000ff']);
  const [rows, setRows] = useState(8);
  const [columns, setColumns] = useState(16);
  const [fileName, setFileName] = useState('Untitled');

  // Single expanded panel state
  const [expandedPanel, setExpandedPanel] = useState<'grid' | 'colors' | 'animation' | 'importexport' | null>('grid');

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

  // Import/Export state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importExportError, setImportExportError] = useState<string | null>(null);
  const [useCumulative, setUseCumulative] = useState(true);
  const [importRows, setImportRows] = useState(8);
  const [importColumns, setImportColumns] = useState(32);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('8×32');

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

  const togglePanel = (panel: 'grid' | 'colors' | 'animation' | 'importexport') => {
    setExpandedPanel(prev => prev === panel ? null : panel);
  };

  const CollapsibleCard = ({ 
    title, 
    panelKey, 
    children 
  }: { 
    title: string; 
    panelKey: 'grid' | 'colors' | 'animation' | 'importexport'; 
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

  const isCustomSelected = selectedPreset === 'Custom';

  const handlePresetSelect = (preset: typeof presetResolutions[0]) => {
    setSelectedPreset(preset.label);
    setIsDropdownOpen(false);
    
    if (preset.label !== 'Custom') {
      setImportRows(preset.rows);
      setImportColumns(preset.columns);
    }
  };

  const clamp = (value: number, min: number = 1, max: number = 64) => 
    Math.min(max, Math.max(min, value));

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportExportError(null);

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
      
      // Update current editor with imported data
      setRows(importRows);
      setColumns(importColumns);
      setTotalFrames(frames.length);
      setLedFrames(frames);
      setCurrentFrame(0);
      setStartFrame(0);
      setEndFrame(frames.length - 1);

      toast.success(`Imported ${frames.length} frame${frames.length !== 1 ? 's' : ''} successfully!`);

    } catch (err) {
      setImportExportError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveAsGif = async () => {
    try {
      setIsExporting(true);
      setImportExportError(null);

      const frameData: FrameData[] = ledFrames.map(frame => ({
        width: columns,
        height: rows,
        pixels: frame
      }));

      await saveAsGif(frameData, `${fileName}.gif`);
      toast.success('GIF exported successfully!');
    } catch (err) {
      setImportExportError(err instanceof Error ? err.message : 'Failed to save GIF');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveAsPng = async () => {
    try {
      setIsExporting(true);
      setImportExportError(null);

      const frameData: FrameData[] = ledFrames.map(frame => ({
        width: columns,
        height: rows,
        pixels: frame
      }));

      await saveAsPng(frameData, `${fileName}.png`);
      toast.success('PNG exported successfully!');
    } catch (err) {
      setImportExportError(err instanceof Error ? err.message : 'Failed to save PNG');
    } finally {
      setIsExporting(false);
    }
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

            <CollapsibleCard title="Colors" panelKey="colors">
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

            <CollapsibleCard title="Import/Export" panelKey="importexport">
              <div className="space-y-4">
                {/* Import Section */}
                <div>
                  <Label className="text-sm text-gray-300 mb-2 block">Import Animation</Label>
                  <Button
                    onClick={handleImportClick}
                    variant="outline"
                    disabled={isImporting}
                    className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isImporting ? 'Importing...' : 'Import GIF/PNG'}
                  </Button>
                </div>

                <div>
                  <Label className="text-xs text-gray-400 mb-2 block">Target Resolution</Label>
                  <div className="relative">
                    <Button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      variant="outline"
                      className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 justify-between text-sm"
                    >
                      {selectedPreset}
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    
                    {isDropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-50">
                        {presetResolutions.map((preset) => (
                          <button
                            key={preset.label}
                            onClick={() => handlePresetSelect(preset)}
                            className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 first:rounded-t-md last:rounded-b-md text-sm"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {isCustomSelected && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="import-rows" className="text-xs text-gray-400">Rows</Label>
                      <Input
                        id="import-rows"
                        type="number"
                        min="1"
                        max="64"
                        value={importRows}
                        onChange={(e) => setImportRows(clamp(parseInt(e.target.value) || 1))}
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
                        onChange={(e) => setImportColumns(clamp(parseInt(e.target.value) || 1))}
                        className="bg-gray-700 border-gray-600 text-white text-sm mt-1"
                      />
                    </div>
                  </div>
                )}

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

                {/* Export Section */}
                <div className="border-t border-gray-600 pt-4">
                  <Label className="text-sm text-gray-300 mb-2 block">Export Animation</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handleSaveAsGif}
                      variant="outline"
                      disabled={isExporting}
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Save GIF
                    </Button>

                    <Button
                      onClick={handleSaveAsPng}
                      variant="outline"
                      disabled={isExporting}
                      className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
                    >
                      <FileImage className="w-4 h-4 mr-2" />
                      Save PNG
                    </Button>
                  </div>
                </div>

                {importExportError && (
                  <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-900/20 border border-red-800 rounded">
                    <AlertCircle className="w-4 h-4" />
                    {importExportError}
                  </div>
                )}

                <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
                  <p className="mb-1">• Import: Replace current animation with GIF/PNG</p>
                  <p className="mb-1">• Export GIF: Save as animated GIF</p>
                  <p>• Export PNG: Save first frame as PNG</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".gif,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
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
