import React, { useRef, useEffect, useCallback, useMemo } from 'react';

interface LEDGridCanvasProps {
  rows: number;
  columns: number;
  colors: string[][];
  onLedClick: (row: number, col: number) => void;
  isDropperActive?: boolean;
}

export const LEDGridCanvas: React.FC<LEDGridCanvasProps> = React.memo(({
  rows,
  columns,
  colors,
  onLedClick,
  isDropperActive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate optimal canvas size and LED size
  const { canvasWidth, canvasHeight, ledSize } = useMemo(() => {
    const maxWidth = 1200; // Increased from 800 to 1200
    const maxHeight = 900; // Increased from 600 to 900

    // Calculate LED size based on available space
    const ledSizeX = Math.floor(maxWidth / columns);
    const ledSizeY = Math.floor(maxHeight / rows);
    const ledSize = Math.min(ledSizeX, ledSizeY, 32); // Increased max from 24px to 32px per LED

    const canvasWidth = columns * ledSize;
    const canvasHeight = rows * ledSize;

    return { canvasWidth, canvasHeight, ledSize };
  }, [rows, columns]);

  // Draw the LED grid
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw each LED
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const x = col * ledSize;
        const y = row * ledSize;
        const color = colors[row]?.[col] || '#000000';
        const isOff = color === '#000000';

        // Draw LED background
        ctx.fillStyle = color;
        ctx.fillRect(x, y, ledSize, ledSize);

        // Draw LED border
        ctx.strokeStyle = '#404040';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, ledSize, ledSize);

        // Draw glow effect for lit LEDs
        if (!isOff) {
          ctx.shadowColor = color;
          ctx.shadowBlur = 4;
          ctx.fillStyle = color;
          ctx.fillRect(x + 2, y + 2, ledSize - 4, ledSize - 4);
          ctx.shadowBlur = 0; // Reset shadow
        }
      }
    }
  }, [rows, columns, colors, canvasWidth, canvasHeight, ledSize]);

  // Handle canvas click
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.floor(x / ledSize);
    const row = Math.floor(y / ledSize);

    if (row >= 0 && row < rows && col >= 0 && col < columns) {
      onLedClick(row, col);
    }
  }, [rows, columns, ledSize, onLedClick]);

  // Redraw when colors change
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  return (
    <div ref={containerRef} className="overflow-auto">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onClick={handleCanvasClick}
        className={`border border-gray-600 rounded ${
          isDropperActive ? 'cursor-crosshair' : 'cursor-pointer'
        }`}
        style={{
          imageRendering: 'pixelated', // For crisp LED pixels
        }}
      />
    </div>
  );
});

LEDGridCanvas.displayName = 'LEDGridCanvas';
