
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  const presetColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
    '#ff00ff', '#00ffff', '#ff8000', '#8000ff', '#0080ff', '#80ff00',
    '#ff0080', '#80ff80', '#8080ff', '#ff8080', '#808080', '#400040'
  ];

  return (
    <div className="space-y-6">
      {/* Color Input Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-300">Selected Color</Label>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="w-12 h-12 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-500 transition-colors"
              style={{ backgroundColor: selectedColor }}
            />
          </div>
          <div className="flex-1">
            <Input
              type="text"
              value={selectedColor}
              onChange={(e) => onColorChange(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
              placeholder="#ffffff"
            />
          </div>
        </div>
      </div>
      
      {/* Preset Colors Section */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-300">Preset Colors</Label>
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onColorChange(color)}
              className={`w-10 h-10 rounded-lg border-2 hover:scale-105 transition-all duration-200 ${
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
  );
};
