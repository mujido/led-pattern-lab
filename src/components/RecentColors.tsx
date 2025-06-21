
import React from 'react';

interface RecentColorsProps {
  colors: string[];
  onColorSelect: (color: string) => void;
}

export const RecentColors: React.FC<RecentColorsProps> = ({ colors, onColorSelect }) => {
  return (
    <div className="grid grid-cols-6 gap-2">
      {colors.map((color, index) => (
        <button
          key={`${color}-${index}`}
          onClick={() => onColorSelect(color)}
          className="w-8 h-8 rounded-md border-2 border-gray-600 hover:border-gray-400 transition-all hover:scale-110"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      {/* Fill empty slots */}
      {Array(12 - colors.length).fill(null).map((_, index) => (
        <div
          key={`empty-${index}`}
          className="w-8 h-8 rounded-md border-2 border-gray-700 bg-gray-800"
        />
      ))}
    </div>
  );
};
