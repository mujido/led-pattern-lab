import React from 'react';

interface LEDBoxProps {
  color: string;
  onClick: () => void;
}

export const LEDBox: React.FC<LEDBoxProps> = ({ color, onClick }) => {
  const isOff = color === '#000000';

  return (
    <button
      onClick={onClick}
      className="w-6 h-6 rounded-sm border border-gray-600 hover:border-gray-400 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      style={{
        backgroundColor: color,
        boxShadow: isOff ? 'none' : `0 0 8px ${color}40, inset 0 0 4px ${color}60`
      }}
      title={`LED (${color})`}
    />
  );
};
