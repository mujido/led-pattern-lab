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
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1.5rem)`, // Corresponds to w-6
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
