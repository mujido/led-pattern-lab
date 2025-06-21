import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload, FileImage, AlertCircle } from 'lucide-react';
import { loadGif, loadPng, saveAsGif, saveAsPng, detectFileType, type FrameData } from '@/lib/image-utils';
import { Checkbox } from './ui/checkbox';

interface ImageControlsProps {
  onLoadFrames: (frames: string[][][]) => void;
  onSaveFrames: () => string[][][];
  currentRows: number;
  currentColumns: number;
}

export const GifControls: React.FC<ImageControlsProps> = ({
  onLoadFrames,
  onSaveFrames,
  currentRows,
  currentColumns
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState('animation');
  const [useCumulative, setUseCumulative] = useState(true);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const fileType = detectFileType(file);

      if (fileType === 'unknown') {
        throw new Error('Unsupported file type. Please use GIF or PNG files.');
      }

      let frameData: FrameData[];

      if (fileType === 'gif') {
        const result = await loadGif(file, currentColumns, currentRows, useCumulative);
        frameData = result.frames;
      } else {
        const result = await loadPng(file, currentColumns, currentRows);
        frameData = result.frames;
      }

      if (frameData.length === 0) {
        throw new Error('No frames found in the file.');
      }

      const frames: string[][][] = frameData.map(frame => frame.pixels);
      onLoadFrames(frames);

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setFilename(baseName);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

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
        <Label className="text-sm text-gray-300 mb-2 block">Image Import/Export</Label>

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

        <div className="space-y-2">
          <Button
            onClick={handleLoadClick}
            variant="outline"
            disabled={isLoading}
            className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isLoading ? 'Loading...' : 'Load GIF/PNG'}
          </Button>

          <div className="items-top flex space-x-2 my-2">
            <Checkbox id="cumulative" checked={useCumulative} onCheckedChange={(checked) => setUseCumulative(Boolean(checked))} />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="cumulative"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                My GIF is optimized (layers frames)
              </label>
              <p className="text-xs text-muted-foreground">
                Uncheck if your GIF has ghosting or artifacts.
              </p>
            </div>
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

        <input
          ref={fileInputRef}
          type="file"
          accept=".gif,.png"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-900/20 border border-red-800 rounded">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
        <p className="mb-1">• Load: Import GIF/PNG frames into the editor</p>
        <p className="mb-1">• Save GIF: Export as animated GIF</p>
        <p>• Save PNG: Export first frame as PNG</p>
      </div>
    </div>
  );
};
