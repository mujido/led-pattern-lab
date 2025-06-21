
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Grid2x2, Palette } from 'lucide-react';

interface GridControlsProps {
  rows: number;
  columns: number;
  onGridSizeChange: (rows: number, columns: number) => void;
  onClearGrid: () => void;
}

export const GridControls: React.FC<GridControlsProps> = ({
  rows,
  columns,
  onGridSizeChange,
  onClearGrid
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="rows" className="text-sm text-gray-300">Rows</Label>
          <Input
            id="rows"
            type="number"
            min="1"
            max="32"
            value={rows}
            onChange={(e) => onGridSizeChange(parseInt(e.target.value) || 1, columns)}
            className="bg-gray-700 border-gray-600 text-white mt-1"
          />
        </div>
        <div>
          <Label htmlFor="columns" className="text-sm text-gray-300">Columns</Label>
          <Input
            id="columns"
            type="number"
            min="1"
            max="64"
            value={columns}
            onChange={(e) => onGridSizeChange(rows, parseInt(e.target.value) || 1)}
            className="bg-gray-700 border-gray-600 text-white mt-1"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Button
          onClick={onClearGrid}
          variant="outline"
          className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
        >
          <Palette className="w-4 h-4 mr-2" />
          Clear Grid
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={() => onGridSizeChange(8, 8)}
            variant="outline"
            size="sm"
            className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            8×8
          </Button>
          <Button
            onClick={() => onGridSizeChange(16, 16)}
            variant="outline"
            size="sm"
            className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            16×16
          </Button>
          <Button
            onClick={() => onGridSizeChange(8, 32)}
            variant="outline"
            size="sm"
            className="flex-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
          >
            8×32
          </Button>
        </div>
      </div>
    </div>
  );
};
