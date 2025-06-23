
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, ChevronDown, Download, FileImage, AlertCircle } from 'lucide-react';
import { loadGif, loadPng, detectFileType, saveAsGif, saveAsPng, type FrameData } from '@/lib/image-utils';
import { toast } from 'sonner';

interface ImportExportPanelProps {
  fileName: string;
  rows: number;
  columns: number;
  ledFrames: string[][][];
  onImport: (frames: string[][][], newRows: number, newColumns: number) => void;
}

const presetResolutions = [
  { label: '8×32', rows: 8, columns: 32 },
  { label: '32×32', rows: 32, columns: 32 },
  { label: '64×64', rows: 64, columns: 64 },
  { label: 'Custom', rows: -1, columns: -1 }
];

export const ImportExportPanel: React.FC<ImportExportPanelProps> = ({
  fileName,
  rows,
  columns,
  ledFrames,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [importExportError, setImportExportError] = useState<string | null>(null);
  const [useCumulative, setUseCumulative] = useState(true);
  const [importRows, setImportRows] = useState(8);
  const [importColumns, setImportColumns] = useState(32);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('8×32');

  const clamp = (value: number, min: number = 1, max: number = 64) => Math.min(max, Math.max(min, value));

  const handlePresetSelect = (preset: typeof presetResolutions[0]) => {
    setSelectedPreset(preset.label);
    setIsDropdownOpen(false);
    
    if (preset.label !== 'Custom') {
      setImportRows(preset.rows);
      setImportColumns(preset.columns);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportExportError(null);

    try {
      const fileType = detectFileType(file);

      if (fileType === 'unknown') {
        throw new Error('Unsupported file type. Please use GIF or PNG files.');
      }

      let frameData: FrameData[];

      if (fileType === 'gif') {
        const result = await loadGif(file, importColumns, importRows, useCumulative);
        frameData = result.frames;
      } else {
        const result = await loadPng(file, importColumns, importRows);
        frameData = result.frames;
      }

      if (frameData.length === 0) {
        throw new Error('No frames found in the file.');
      }

      const frames: string[][][] = frameData.map(frame => frame.pixels);
      onImport(frames, importRows, importColumns);

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

  const handleSaveAsPng = async () => {
    try {
      setIsExporting(true);
      setImportExportError(null);

      const frameData: FrameData[] = ledFrames.map(frame => ({
        width: columns,
        height: rows,
        pixels: frame
      }));

      await saveAsPng(frameData, `${fileName}.png`);
      toast.success('PNG exported successfully!');
    } catch (err) {
      setImportExportError(err instanceof Error ? err.message : 'Failed to save PNG');
    } finally {
      setIsExporting(false);
    }
  };

  const isCustomSelected = selectedPreset === 'Custom';

  return (
    <div className="space-y-4">
      {/* Import Section */}
      <div>
        <Label className="text-sm text-gray-300 mb-2 block">Import Animation</Label>
        <Button
          onClick={handleImportClick}
          variant="outline"
          disabled={isImporting}
          className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          {isImporting ? 'Importing...' : 'Import GIF/PNG'}
        </Button>
      </div>

      <div>
        <Label className="text-xs text-gray-400 mb-2 block">Target Resolution</Label>
        <div className="relative">
          <Button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            variant="outline"
            className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 justify-between text-sm"
          >
            {selectedPreset}
            <ChevronDown className="w-4 h-4" />
          </Button>
          
          {isDropdownOpen && (
            <div className="absolute top-full left-0 w-full mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-50">
              {presetResolutions.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full px-3 py-2 text-left text-white hover:bg-gray-600 first:rounded-t-md last:rounded-b-md text-sm"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isCustomSelected && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="import-rows" className="text-xs text-gray-400">Rows</Label>
            <Input
              id="import-rows"
              type="number"
              min="1"
              max="64"
              value={importRows}
              onChange={(e) => setImportRows(clamp(parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 text-white text-sm mt-1"
            />
          </div>
          <div>
            <Label htmlFor="import-columns" className="text-xs text-gray-400">Columns</Label>
            <Input
              id="import-columns"
              type="number"
              min="1"
              max="64"
              value={importColumns}
              onChange={(e) => setImportColumns(clamp(parseInt(e.target.value) || 1))}
              className="bg-gray-700 border-gray-600 text-white text-sm mt-1"
            />
          </div>
        </div>
      )}

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
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleSaveAsGif}
            variant="outline"
            disabled={isExporting}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Save GIF
          </Button>

          <Button
            onClick={handleSaveAsPng}
            variant="outline"
            disabled={isExporting}
            className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600 disabled:opacity-50"
          >
            <FileImage className="w-4 h-4 mr-2" />
            Save PNG
          </Button>
        </div>
      </div>

      {importExportError && (
        <div className="flex items-center gap-2 text-red-400 text-xs p-2 bg-red-900/20 border border-red-800 rounded">
          <AlertCircle className="w-4 h-4" />
          {importExportError}
        </div>
      )}

      <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
        <p className="mb-1">• Import: Replace current animation with GIF/PNG</p>
        <p className="mb-1">• Export GIF: Save as animated GIF</p>
        <p>• Export PNG: Save first frame as PNG</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".gif,.png"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
};
