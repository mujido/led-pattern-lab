import React, { useMemo } from 'react';

interface LEDBoxProps {
  color: string;
  onClick: () => void;
  row: number;
  col: number;
}

export const LEDBox: React.FC<LEDBoxProps> = React.memo(({ color, onClick, row, col }) => {
  const isOff = color === '#000000';

  // Memoize the button style to prevent recalculation
  const buttonStyle = useMemo(() => ({
    backgroundColor: color,
    boxShadow: isOff ? 'none' : `0 0 8px ${color}40, inset 0 0 4px ${color}60`
  }), [color, isOff]);

  return (
    <button
      onClick={onClick}
      className="w-6 h-6 rounded-sm border border-gray-600 hover:border-gray-400 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      style={buttonStyle}
      title={`LED (${color})`}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if the color actually changed
  return prevProps.color === nextProps.color;
});

LEDBox.displayName = 'LEDBox';
