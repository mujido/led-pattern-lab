
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ selectedColor, onColorChange }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <input
            type="color"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="w-16 h-16 rounded-lg border-2 border-gray-600 cursor-pointer"
            style={{ backgroundColor: selectedColor }}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="hex-input" className="text-sm text-gray-300">Hex Color</Label>
          <Input
            id="hex-input"
            type="text"
            value={selectedColor}
            onChange={(e) => onColorChange(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white mt-1"
            placeholder="#ffffff"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-6 gap-2">
        {[
          '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
          '#ffffff', '#ff8000', '#8000ff', '#0080ff', '#80ff00', '#ff0080'
        ].map((color) => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className="w-8 h-8 rounded-md border-2 border-gray-600 hover:border-gray-400 transition-colors"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
};
