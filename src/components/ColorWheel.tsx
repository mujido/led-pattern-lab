
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface ColorWheelProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  size?: number;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({ 
  selectedColor, 
  onColorChange, 
  size = 200 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentHue, setCurrentHue] = useState(0);
  const [currentSaturation, setSaturation] = useState(100);
  const [currentLightness, setLightness] = useState(50);

  // Convert hex to HSL
  const hexToHsl = useCallback((hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }, []);

  // Convert HSL to hex
  const hslToHex = useCallback((h: number, s: number, l: number) => {
    h /= 360;
    s /= 100;
    l /= 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }, []);

  // Initialize HSL values from selected color
  useEffect(() => {
    const [h, s, l] = hexToHsl(selectedColor);
    setCurrentHue(h);
    setSaturation(s);
    setLightness(l);
  }, [selectedColor, hexToHsl]);

  // Draw the color wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    // Draw hue wheel
    for (let angle = 0; angle < 360; angle += 1) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.lineWidth = 20;
      ctx.strokeStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.stroke();
    }

    // Draw saturation/lightness square
    const squareSize = radius * 0.6;
    const squareX = centerX - squareSize / 2;
    const squareY = centerY - squareSize / 2;

    // Create gradient for saturation/lightness
    const imageData = ctx.createImageData(squareSize, squareSize);
    const data = imageData.data;

    for (let x = 0; x < squareSize; x++) {
      for (let y = 0; y < squareSize; y++) {
        const saturation = (x / squareSize) * 100;
        const lightness = ((squareSize - y) / squareSize) * 100;
        
        const color = hslToHex(currentHue, saturation, lightness);
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        
        const index = (y * squareSize + x) * 4;
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255;
      }
    }

    ctx.putImageData(imageData, squareX, squareY);

    // Draw current selection indicators
    // Hue indicator
    const hueAngle = (currentHue * Math.PI) / 180;
    const hueX = centerX + Math.cos(hueAngle) * radius;
    const hueY = centerY + Math.sin(hueAngle) * radius;
    
    ctx.beginPath();
    ctx.arc(hueX, hueY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Saturation/Lightness indicator
    const satX = squareX + (currentSaturation / 100) * squareSize;
    const satY = squareY + ((100 - currentLightness) / 100) * squareSize;
    
    ctx.beginPath();
    ctx.arc(satX, satY, 6, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [currentHue, currentSaturation, currentLightness, size, hslToHex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && e.type === 'mousemove') return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > radius - 30 && distance < radius + 10) {
      // Clicking on hue wheel
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      const hue = angle < 0 ? angle + 360 : angle;
      setCurrentHue(hue);
      
      const newColor = hslToHex(hue, currentSaturation, currentLightness);
      onColorChange(newColor);
    } else if (distance < radius * 0.6) {
      // Clicking in saturation/lightness square
      const squareSize = radius * 0.6;
      const squareX = centerX - squareSize / 2;
      const squareY = centerY - squareSize / 2;
      
      const relX = Math.max(0, Math.min(squareSize, x - squareX));
      const relY = Math.max(0, Math.min(squareSize, y - squareY));
      
      const saturation = (relX / squareSize) * 100;
      const lightness = ((squareSize - relY) / squareSize) * 100;
      
      setSaturation(saturation);
      setLightness(lightness);
      
      const newColor = hslToHex(currentHue, saturation, lightness);
      onColorChange(newColor);
    }
  }, [isDragging, size, currentHue, currentSaturation, currentLightness, hslToHex, onColorChange]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMouseMove(e as any);
      };
      const handleGlobalMouseUp = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
};
