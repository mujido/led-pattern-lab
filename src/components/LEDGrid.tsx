
import React from 'react';
import { LEDBox } from './LEDBox';

interface LEDGridProps {
  rows: number;
  columns: number;
  colors: string[][];
  onLedClick: (row: number, col: number) => void;
}

export const LEDGrid: React.FC<LEDGridProps> = ({ rows, columns, colors, onLedClick }) => {
  return (
    <div className="overflow-auto">
      <div 
        className="grid gap-1 mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          maxWidth: `${columns * 24 + (columns - 1) * 4}px`
        }}
      >
        {Array(rows).fill(null).map((_, row) =>
          Array(columns).fill(null).map((_, col) => (
            <LEDBox
              key={`${row}-${col}`}
              color={colors[row]?.[col] || '#000000'}
              onClick={() => onLedClick(row, col)}
            />
          ))
        )}
      </div>
    </div>
  );
};
