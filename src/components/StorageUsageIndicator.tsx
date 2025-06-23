import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { HardDrive } from 'lucide-react';
import { LEDFile } from '@/lib/file-storage';
import { storageAdapter } from '@/lib/storage-adapter';

interface StorageUsageIndicatorProps {
  files: LEDFile[];
  className?: string;
}

interface StorageStats {
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usagePercentage: number;
}

export const StorageUsageIndicator: React.FC<StorageUsageIndicatorProps> = ({
  files,
  className = ""
}) => {
  const [esp32Stats, setEsp32Stats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch ESP32 storage stats
  useEffect(() => {
    const fetchStorageStats = async () => {
      setLoading(true);
      try {
        const stats = await storageAdapter.getStorageStats();
        setEsp32Stats(stats);
      } catch (error) {
        console.error('Failed to fetch storage stats:', error);
        setEsp32Stats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStorageStats();
  }, []);

  // Calculate storage usage for local files
  const calculateFileSize = (file: LEDFile): number => {
    // Estimate size based on frame data
    const frameSize = file.rows * file.columns * 7; // 7 bytes per color (#RRGGBB)
    const totalFrameSize = frameSize * file.totalFrames;
    const metadataSize = JSON.stringify(file).length;
    return totalFrameSize + metadataSize;
  };

  const localUsedBytes = files.reduce((total, file) => total + calculateFileSize(file), 0);

  // Convert to more readable units
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Use ESP32 stats if available, otherwise use estimated values
  const totalBytes = esp32Stats?.totalBytes || (50 * 1024 * 1024); // 50MB fallback
  const usedBytes = esp32Stats?.usedBytes || localUsedBytes;
  const usagePercentage = Math.min((usedBytes / totalBytes) * 100, 100);

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
            <span className="text-sm font-medium text-gray-300">
              Storage Usage
              <span className="text-xs ml-2 text-purple-400">({esp32Stats ? "ESP32" : "Local"})</span>
            </span>
            <span className="text-xs text-gray-400">
              {loading ? 'Loading...' : `${formatBytes(usedBytes)} / ${formatBytes(totalBytes)}`}
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
