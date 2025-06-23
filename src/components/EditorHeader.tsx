
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';

interface EditorHeaderProps {
  fileName: string;
  hasUnsavedChanges: boolean;
  onBackToFiles: () => void;
  onSave: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  fileName,
  hasUnsavedChanges,
  onBackToFiles,
  onSave
}) => {
  return (
    <header className="text-center mb-8">
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={onBackToFiles}
          variant="secondary"
          className="border-blue-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Files
        </Button>
        <Button
          onClick={onSave}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
          {hasUnsavedChanges && <span className="ml-1 text-yellow-300">*</span>}
        </Button>
      </div>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
        {fileName}
        {hasUnsavedChanges && <span className="text-yellow-300 ml-2">*</span>}
      </h1>
      <p className="text-gray-400">Design beautiful animated patterns for your LED matrix</p>
    </header>
  );
};
