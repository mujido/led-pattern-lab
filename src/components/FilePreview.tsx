import React, { useState, useEffect } from 'react';

interface FilePreviewProps {
  frames: string[][][];
  rows: number;
  columns: number;
  className?: string;
  fileName?: string; // Optional filename to load thumbnail
  baseUrl?: string; // Optional base URL for thumbnail loading
}

export const FilePreview: React.FC<FilePreviewProps> = ({
  frames,
  rows,
  columns,
  className = "",
  fileName,
  baseUrl
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Try to load thumbnail if filename and baseUrl are provided
  useEffect(() => {
    if (fileName && baseUrl && !thumbnailError) {
      const url = `${baseUrl}/api/led-files/${encodeURIComponent(fileName)}.thumb`;
      console.log('🔍 Debug: Loading thumbnail from:', url);
      setThumbnailUrl(url);
    }
  }, [fileName, baseUrl, thumbnailError]);

  // Fallback to LED grid preview
  const renderGridPreview = () => {
    const firstFrame = frames[0] || [];
    const maxSize = 100; // Maximum preview size in pixels
    const cellSize = Math.min(maxSize / Math.max(rows, columns), 8);

    return (
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
    );
  };

  // Render thumbnail if available, otherwise fallback to grid
  if (thumbnailUrl && !thumbnailError) {
    return (
      <div className={`${className}`}>
        <img
          src={thumbnailUrl}
          alt={`Preview of ${fileName}`}
          className="rounded border border-gray-500"
          style={{ width: '64px', height: '64px', objectFit: 'contain' }}
          onError={(e) => {
            console.log('❌ Debug: Thumbnail failed to load:', thumbnailUrl, e);
            setThumbnailError(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {renderGridPreview()}
    </div>
  );
};
