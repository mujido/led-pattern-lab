
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, FileImage, AlertCircle } from 'lucide-react';
import { saveAsGif, saveAsPng, type FrameData } from '@/lib/image-utils';

interface ImageControlsProps {
  onSaveFrames: () => string[][][];
  currentRows: number;
  currentColumns: number;
}

export const GifControls: React.FC<ImageControlsProps> = ({
  onSaveFrames,
  currentRows,
  currentColumns
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState('animation');

  const handleSaveAsGif = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const frames = onSaveFrames();
      const frameData: FrameData[] = frames.map(frame => ({
        width: currentColumns,
        height: currentRows,
        pixels: frame
      }));

      await saveAsGif(frameData, `${filename}.gif`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save GIF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsPng = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const frames = onSaveFrames();
      const frameData: FrameData[] = frames.map(frame => ({
        width: currentColumns,
        height: currentRows,
        pixels: frame
      }));

      await saveAsPng(frameData, `${filename}.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save PNG');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm text-gray-300 mb-2 block">Export Animation</Label>

        <div className="mb-3">
          <Label htmlFor="filename" className="text-xs text-gray-400">Filename</Label>
          <Input
            id="filename"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white text-sm mt-1"
            placeholder="animation"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleSaveAsGif}
            variant="outline"
            disabled={isLoading}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Save GIF
          </Button>

          <Button
            onClick={handleSaveAsPng}
            variant="outline"
            disabled={isLoading}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
          >
            <FileImage className="w-4 h-4 mr-2" />
            Save PNG
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-900/20 border border-red-800 rounded">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
        <p className="mb-1">• Save GIF: Export as animated GIF</p>
        <p>• Save PNG: Export first frame as PNG</p>
      </div>
    </div>
  );
};
