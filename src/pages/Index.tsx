import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { ColorPicker } from '@/components/ColorPicker';
import { RecentColors } from '@/components/RecentColors';
import { LEDGridCanvas } from '@/components/LEDGridCanvas';
import { GridControls } from '@/components/GridControls';
import { AnimationControls } from '@/components/AnimationControls';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [recentColors, setRecentColors] = useState(['#ff0000', '#00ff00', '#0000ff']);
  const [rows, setRows] = useState(8);
  const [columns, setColumns] = useState(16);

  // Animation state
  const [totalFrames, setTotalFrames] = useState(8);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(15); // Reduced to 15 FPS for better performance
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(7);

  // LED colors for all frames
  const [ledFrames, setLedFrames] = useState<string[][][]>(() =>
    Array(8).fill(null).map(() =>
      Array(8).fill(null).map(() => Array(16).fill('#000000'))
    )
  );

  // Memoize current frame colors to prevent unnecessary re-renders
  const currentFrameColors = useMemo(() => {
    return ledFrames[currentFrame] || [];
  }, [ledFrames, currentFrame]);

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log('State updated:', {
      rows,
      columns,
      totalFrames,
      currentFrame,
      ledFramesLength: ledFrames.length,
      currentFrameData: ledFrames[currentFrame]
    });
  }, [rows, columns, totalFrames, currentFrame, ledFrames]);

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

    // Resize all frames
    setLedFrames(prev => {
      return prev.map(frame => {
        const newGrid = Array(newRows).fill(null).map(() => Array(newCols).fill('#000000'));

        // Copy existing colors where possible
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
        // Add new frames
        const newFrames = [...prev];
        for (let i = prev.length; i < newFrameCount; i++) {
          newFrames.push(Array(rows).fill(null).map(() => Array(columns).fill('#000000')));
        }
        return newFrames;
      } else {
        // Remove frames
        return prev.slice(0, newFrameCount);
      }
    });

    // Adjust current frame if needed
    if (currentFrame >= newFrameCount) {
      setCurrentFrame(newFrameCount - 1);
    }

    // Adjust range if needed
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

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LED Pattern Designer
          </h1>
          <p className="text-gray-400">Design beautiful animated patterns for your LED matrix</p>
        </header>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-4 bg-gray-800 border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Grid Settings</h2>
              <GridControls
                rows={rows}
                columns={columns}
                onGridSizeChange={handleGridSizeChange}
                onClearGrid={clearGrid}
              />
            </Card>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Animation</h2>
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
            </Card>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Color Picker</h2>
              <ColorPicker
                selectedColor={selectedColor}
                onColorChange={handleColorChange}
              />
            </Card>

            <Card className="p-4 bg-gray-800 border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Recent Colors</h2>
              <RecentColors
                colors={recentColors}
                onColorSelect={setSelectedColor}
              />
            </Card>
          </div>

          {/* LED Grid */}
          <div className="lg:col-span-4">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <div className="mb-4 text-center">
                <span className="text-lg font-semibold">Frame {currentFrame + 1} of {totalFrames}</span>
              </div>
              <LEDGridCanvas
                rows={rows}
                columns={columns}
                colors={currentFrameColors}
                onLedClick={handleLedClick}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
