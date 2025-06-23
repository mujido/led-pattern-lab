
import React from 'react';
import { Card } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';
import { LEDFile } from '@/lib/file-storage';

interface StorageUsageIndicatorProps {
  files: LEDFile[];
  className?: string;
}

export const StorageUsageIndicator: React.FC<StorageUsageIndicatorProps> = ({
  files,
  className = ""
}) => {
  // Calculate storage usage
  const calculateFileSize = (file: LEDFile): number => {
    // Estimate size based on frame data
    const frameSize = file.rows * file.columns * 7; // 7 bytes per color (#RRGGBB)
    const totalFrameSize = frameSize * file.totalFrames;
    const metadataSize = JSON.stringify(file).length;
    return totalFrameSize + metadataSize;
  };

  const totalUsedBytes = files.reduce((total, file) => total + calculateFileSize(file), 0);
  
  // Convert to more readable units
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Estimate total available space (for display purposes)
  const estimatedTotalSpace = 50 * 1024 * 1024; // 50MB estimate
  const usagePercentage = Math.min((totalUsedBytes / estimatedTotalSpace) * 100, 100);

  const getUsageColor = (percentage: number): string => {
    if (percentage < 60) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={`p-4 bg-gray-800 border-gray-700 ${className}`}>
      <div className="flex items-center space-x-3">
        <HardDrive className="w-5 h-5 text-gray-400" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">Storage Usage</span>
            <span className="text-xs text-gray-400">
              {formatBytes(totalUsedBytes)} / {formatBytes(estimatedTotalSpace)}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usagePercentage)}`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-500">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-gray-500">
              {usagePercentage.toFixed(1)}% used
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
