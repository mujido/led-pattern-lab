
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Pipette, Palette } from 'lucide-react';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  isDropperActive?: boolean;
  onDropperToggle?: (active: boolean) => void;
  recentColors: string[];
  onRecentColorSelect: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  selectedColor, 
  onColorChange,
  isDropperActive = false,
  onDropperToggle,
  recentColors,
  onRecentColorSelect
}) => {
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);

  const presetColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
    '#ff00ff', '#00ffff', '#ff8000', '#8000ff', '#0080ff', '#80ff00',
    '#ff0080', '#80ff80', '#8080ff', '#ff8080', '#808080', '#400040',
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
    '#c0c0c0', '#ffa500', '#a52a2a', '#dda0dd', '#98fb98', '#f0e68c',
    '#deb887', '#5f9ea0', '#ff1493', '#00bfff', '#32cd32', '#ffd700'
  ];

  const handleDropperClick = () => {
    if (onDropperToggle) {
      onDropperToggle(!isDropperActive);
    }
  };

  const handlePresetColorClick = (color: string) => {
    onColorChange(color);
    setIsColorDialogOpen(false);
  };

  const handleColorInputChange = (color: string) => {
    onColorChange(color);
  };

  return (
    <div className="space-y-6">
      {/* Current Color Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-300">Current Color</Label>
        <div className="flex items-center gap-3">
          <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
            <DialogTrigger asChild>
              <button
                className="w-12 h-12 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-500 transition-all hover:scale-105 shadow-lg"
                style={{ backgroundColor: selectedColor }}
                title="Click to open color picker"
              />
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Choose Color
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* HTML Color Picker */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Color Picker</Label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => handleColorInputChange(e.target.value)}
                    className="w-full h-12 rounded-lg border-2 border-gray-600 cursor-pointer"
                  />
                </div>
                
                {/* Color Input */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Hex Code</Label>
                  <Input
                    type="text"
                    value={selectedColor}
                    onChange={(e) => handleColorInputChange(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white font-mono"
                    placeholder="#ffffff"
                  />
                </div>

                {/* Preset Colors */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-300">Preset Colors</Label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                    {presetColors.map((color) => (
                      <button
                        key={color}
                        onClick={() => handlePresetColorClick(color)}
                        className={`w-8 h-8 rounded-md border-2 hover:scale-110 transition-all duration-200 ${
                          selectedColor === color 
                            ? 'border-purple-400 ring-2 ring-purple-400 ring-opacity-50' 
                            : 'border-gray-600 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex-1">
            <Input
              type="text"
              value={selectedColor}
              onChange={(e) => handleColorInputChange(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
              placeholder="#ffffff"
            />
          </div>

          <Button
            variant={isDropperActive ? "default" : "outline"}
            size="sm"
            onClick={handleDropperClick}
            className={`${
              isDropperActive 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'border-gray-600 text-gray-300 hover:bg-gray-700'
            }`}
            title="Color Dropper - Click to sample colors from the grid"
          >
            <Pipette className="w-4 h-4" />
          </Button>
        </div>
        {isDropperActive && (
          <p className="text-xs text-purple-400">
            Click on any LED in the grid to sample its color
          </p>
        )}
      </div>
      
      {/* Recent Colors Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-300">Recent Colors</Label>
        <div className="grid grid-cols-6 gap-2">
          {recentColors.map((color, index) => (
            <button
              key={`${color}-${index}`}
              onClick={() => onRecentColorSelect(color)}
              className={`w-10 h-10 rounded-lg border-2 hover:scale-105 transition-all duration-200 ${
                selectedColor === color 
                  ? 'border-purple-400 ring-2 ring-purple-400 ring-opacity-50' 
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
          {/* Fill empty slots */}
          {Array(12 - recentColors.length).fill(null).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="w-10 h-10 rounded-lg border-2 border-gray-700 bg-gray-800"
            />
          ))}
        </div>
      </div>
    </div>
  );
};
