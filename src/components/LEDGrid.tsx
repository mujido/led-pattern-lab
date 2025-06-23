import React, { useMemo } from 'react';
import { LEDBox } from './LEDBox';

interface LEDGridProps {
  rows: number;
  columns: number;
  colors: string[][];
  onLedClick: (row: number, col: number) => void;
}

export const LEDGrid: React.FC<LEDGridProps> = React.memo(({ rows, columns, colors, onLedClick }) => {
  // Memoize the grid style to prevent recalculation
  const gridStyle = useMemo(() => ({
    gridTemplateColumns: `repeat(${columns}, 1.5rem)`, // Corresponds to w-6
  }), [columns]);

  return (
    <div className="overflow-auto">
      <div
        className="grid gap-1"
        style={gridStyle}
      >
        {Array(rows).fill(null).map((_, row) =>
          Array(columns).fill(null).map((_, col) => (
            <LEDBox
              key={`${row}-${col}`}
              row={row}
              col={col}
              color={colors[row]?.[col] || '#000000'}
              onClick={() => onLedClick(row, col)}
            />
          ))
        )}
      </div>
    </div>
  );
});

LEDGrid.displayName = 'LEDGrid';
