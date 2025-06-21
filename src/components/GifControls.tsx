
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, Upload } from 'lucide-react';

interface GifControlsProps {
  onLoadGif: (frames: string[][][]) => void;
  onSaveGif: () => void;
}

export const GifControls: React.FC<GifControlsProps> = ({
  onLoadGif,
  onSaveGif
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, we'll just show a placeholder implementation
    // In a real app, you'd need a GIF parsing library
    console.log('GIF file selected:', file.name);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm text-gray-300 mb-2 block">GIF Import/Export</Label>
        <div className="space-y-2">
          <Button
            onClick={handleLoadClick}
            variant="outline"
            className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <Upload className="w-4 h-4 mr-2" />
            Load GIF
          </Button>
          
          <Button
            onClick={onSaveGif}
            variant="outline"
            className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Save as GIF
          </Button>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".gif"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>
      
      <div className="text-xs text-gray-400 p-2 bg-gray-800 rounded">
        <p className="mb-1">• Load: Import GIF frames into the editor</p>
        <p>• Save: Export current animation as GIF</p>
      </div>
    </div>
  );
};
