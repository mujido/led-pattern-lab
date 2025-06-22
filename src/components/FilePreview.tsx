
import React from 'react';

interface FilePreviewProps {
  frames: string[][][];
  rows: number;
  columns: number;
  className?: string;
}

export const FilePreview: React.FC<FilePreviewProps> = ({ 
  frames, 
  rows, 
  columns, 
  className = "" 
}) => {
  const firstFrame = frames[0] || [];
  const maxSize = 100; // Maximum preview size in pixels
  const cellSize = Math.min(maxSize / Math.max(rows, columns), 8);

  return (
    <div className={`${className}`}>
      <div
        className="grid gap-px bg-gray-600 border border-gray-500 rounded"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${cellSize}px)`,
          width: `${columns * cellSize + (columns - 1)}px`,
          height: `${rows * cellSize + (rows - 1)}px`
        }}
      >
        {Array(rows).fill(null).map((_, row) =>
          Array(columns).fill(null).map((_, col) => (
            <div
              key={`${row}-${col}`}
              className="rounded-sm"
              style={{
                backgroundColor: firstFrame[row]?.[col] || '#000000',
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                boxShadow: (firstFrame[row]?.[col] && firstFrame[row]?.[col] !== '#000000') 
                  ? `0 0 2px ${firstFrame[row][col]}40` 
                  : 'none'
              }}
            />
          ))
        )}
      </div>
    </div>
  );
};
