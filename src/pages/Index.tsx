
import React, { useState, useCallback } from 'react';
import { ColorPicker } from '@/components/ColorPicker';
import { RecentColors } from '@/components/RecentColors';
import { LEDGrid } from '@/components/LEDGrid';
import { GridControls } from '@/components/GridControls';
import { Card } from '@/components/ui/card';

const Index = () => {
  const [selectedColor, setSelectedColor] = useState('#ff0000');
  const [recentColors, setRecentColors] = useState(['#ff0000', '#00ff00', '#0000ff']);
  const [rows, setRows] = useState(8);
  const [columns, setColumns] = useState(16);
  const [ledColors, setLedColors] = useState<string[][]>(() => 
    Array(8).fill(null).map(() => Array(16).fill('#000000'))
  );

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
    setLedColors(prev => {
      const newColors = prev.map(rowArray => [...rowArray]);
      newColors[row][col] = selectedColor;
      return newColors;
    });
  }, [selectedColor]);

  const handleGridSizeChange = useCallback((newRows: number, newCols: number) => {
    setRows(newRows);
    setColumns(newCols);
    
    // Resize the grid array
    setLedColors(prev => {
      const newGrid = Array(newRows).fill(null).map(() => Array(newCols).fill('#000000'));
      
      // Copy existing colors where possible
      for (let r = 0; r < Math.min(prev.length, newRows); r++) {
        for (let c = 0; c < Math.min(prev[r].length, newCols); c++) {
          newGrid[r][c] = prev[r][c];
        }
      }
      
      return newGrid;
    });
  }, []);

  const clearGrid = useCallback(() => {
    setLedColors(Array(rows).fill(null).map(() => Array(columns).fill('#000000')));
  }, [rows, columns]);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            LED Pattern Designer
          </h1>
          <p className="text-gray-400">Design beautiful patterns for your LED matrix</p>
        </header>

        <div className="grid lg:grid-cols-4 gap-6">
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
          <div className="lg:col-span-3">
            <Card className="p-6 bg-gray-800 border-gray-700">
              <LEDGrid 
                rows={rows}
                columns={columns}
                colors={ledColors}
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
