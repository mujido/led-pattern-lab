import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { loadGif, detectFileType, saveAsGif, type FrameData } from '@/lib/image-utils';
import { toast } from 'sonner';

interface ImportExportPanelProps {
  fileName: string;
  rows: number;
  columns: number;
  ledFrames: string[][][];
  onImport: (frames: string[][][], newRows: number, newColumns: number) => void;
}

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  fileName,
  rows,
  columns,
  ledFrames,
  onImport
}) => {
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importExportError, setImportExportError] = useState<string | null>(null);
  const [useCumulative, setUseCumulative] = useState(true);
  const [librariesLoaded, setLibrariesLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load GIF libraries from CDN on component mount
  useEffect(() => {
    const loadLibraries = async () => {
      try {
        // Load gif-frames for import
        await loadScript('https://cdn.jsdelivr.net/npm/gif-frames@1.0.1/dist/gif-frames.min.js');

        // Load gif.js for export
        await loadScript('https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js');

        setLibrariesLoaded(true);
      } catch (error) {
        console.error('Failed to load GIF libraries:', error);
        setImportExportError('Failed to load GIF libraries. Please check your internet connection.');
      }
    };

    loadLibraries();
  }, []);

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!librariesLoaded) {
      setImportExportError('GIF libraries are still loading. Please try again.');
      return;
    }

    setIsImporting(true);
    setImportExportError(null);

    try {
      const fileType = detectFileType(file);

      if (fileType === 'unknown') {
        throw new Error('Unsupported file type. Please use GIF files only.');
      }

      // Use current grid dimensions for import
      const result = await loadGif(file, columns, rows, useCumulative);
      const frameData = result.frames;

      if (frameData.length === 0) {
        throw new Error('No frames found in the GIF.');
      }

      const frames: string[][][] = frameData.map(frame => frame.pixels);
      // Keep current grid dimensions when importing
      onImport(frames, rows, columns);

      toast.success(`Imported ${frames.length} frame${frames.length !== 1 ? 's' : ''} successfully!`);

    } catch (err) {
      setImportExportError(err instanceof Error ? err.message : 'Failed to load file');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveAsGif = async () => {
    if (!librariesLoaded) {
      setImportExportError('GIF libraries are still loading. Please try again.');
      return;
    }

    try {
      setIsExporting(true);
      setImportExportError(null);

      const frameData: FrameData[] = ledFrames.map(frame => ({
        width: columns,
        height: rows,
        pixels: frame
      }));

      await saveAsGif(frameData, `${fileName}.gif`);
      toast.success('GIF exported successfully!');
    } catch (err) {
      setImportExportError(err instanceof Error ? err.message : 'Failed to save GIF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Import Section */}
      <div>
        <Label className="text-sm text-gray-300 mb-2 block">Import Animation</Label>
        <Button
          onClick={handleImportClick}
          variant="default"
          disabled={isImporting || !librariesLoaded}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          {!librariesLoaded ? 'Loading...' : isImporting ? 'Importing...' : 'Import GIF'}
        </Button>
        <p className="text-xs text-gray-500 mt-1">
          Will import to current grid size: {columns}×{rows}
        </p>
      </div>

      <div className="items-top flex space-x-2">
        <Checkbox id="cumulative" checked={useCumulative} onCheckedChange={(checked) => setUseCumulative(Boolean(checked))} />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="cumulative"
            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-300"
          >
            GIF is optimized (layers frames)
          </label>
          <p className="text-xs text-gray-500">
            Uncheck if your GIF has ghosting or artifacts.
          </p>
        </div>
      </div>

      {/* Export Section */}
      <div className="border-t border-gray-600 pt-4">
        <Label className="text-sm text-gray-300 mb-2 block">Export Animation</Label>
        <Button
          onClick={handleSaveAsGif}
          variant="default"
          disabled={isExporting || !librariesLoaded}
          className="w-full"
        >
          <Download className="w-4 h-4 mr-2" />
          {!librariesLoaded ? 'Loading...' : isExporting ? 'Exporting...' : 'Save GIF'}
        </Button>
        <p className="text-xs text-gray-500 mt-1">
          Will export at current grid size: {columns}×{rows}
        </p>
      </div>

      {importExportError && (
        <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-900/20 border border-red-800 rounded">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{importExportError}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".gif"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Help text */}
      <div className="text-xs text-gray-500 space-y-1">
        <p className="mb-1">• Import: Replace current animation with GIF</p>
        <p>• Export GIF: Save animation as GIF file</p>
        <p>• Use Grid Settings to change resolution</p>
      </div>
    </div>
  );
};
