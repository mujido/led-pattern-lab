
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Play, Pause } from 'lucide-react';

interface AnimationControlsProps {
  totalFrames: number;
  currentFrame: number;
  isPlaying: boolean;
  playbackSpeed: number;
  startFrame: number;
  endFrame: number;
  onFrameCountChange: (count: number) => void;
  onCurrentFrameChange: (frame: number) => void;
  onPlayToggle: () => void;
  onPlaybackSpeedChange: (speed: number) => void;
  onStartFrameChange: (frame: number) => void;
  onEndFrameChange: (frame: number) => void;
}

export const AnimationControls: React.FC<AnimationControlsProps> = ({
  totalFrames,
  currentFrame,
  isPlaying,
  playbackSpeed,
  startFrame,
  endFrame,
  onFrameCountChange,
  onCurrentFrameChange,
  onPlayToggle,
  onPlaybackSpeedChange,
  onStartFrameChange,
  onEndFrameChange
}) => {
  const Icon = isPlaying ? Pause : Play;

  const handleWheel = (e: React.WheelEvent, value: number, onChange: (val: number) => void, min: number, max: number) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newValue = Math.min(max, Math.max(min, value + delta));
    onChange(newValue);
  };

  return (
    <div className="space-y-4">
      {/* Frame Count */}
      <div>
        <Label htmlFor="frame-count" className="text-sm text-gray-300">Total Frames</Label>
        <Input
          id="frame-count"
          type="number"
          min="1"
          max="100"
          value={totalFrames}
          onChange={(e) => onFrameCountChange(parseInt(e.target.value) || 1)}
          onWheel={(e) => handleWheel(e, totalFrames, onFrameCountChange, 1, 100)}
          className="bg-gray-700 border-gray-600 text-white mt-1"
        />
      </div>

      {/* Frame Navigation */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Current Frame</Label>
        <Input
          type="number"
          min="0"
          max={totalFrames - 1}
          value={currentFrame}
          onChange={(e) => onCurrentFrameChange(Math.min(totalFrames - 1, Math.max(0, parseInt(e.target.value) || 0)))}
          onWheel={(e) => handleWheel(e, currentFrame, onCurrentFrameChange, 0, totalFrames - 1)}
          className="bg-gray-700 border-gray-600 text-white text-center"
        />
      </div>

      {/* Playback Controls */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Playback</Label>
        <Button
          onClick={onPlayToggle}
          className="w-full"
        >
          <Icon className="w-4 h-4 mr-2" />
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
      </div>

      {/* Playback Speed */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Speed: {playbackSpeed} FPS</Label>
        <Slider
          value={[playbackSpeed]}
          onValueChange={(value) => onPlaybackSpeedChange(value[0])}
          min={1}
          max={30}
          step={1}
          className="w-full"
        />
      </div>

      {/* Frame Range */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Playback Range</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="start-frame" className="text-xs text-gray-400">Start</Label>
            <Input
              id="start-frame"
              type="number"
              min="0"
              max={endFrame}
              value={startFrame}
              onChange={(e) => onStartFrameChange(Math.min(endFrame, Math.max(0, parseInt(e.target.value) || 0)))}
              onWheel={(e) => handleWheel(e, startFrame, onStartFrameChange, 0, endFrame)}
              className="bg-gray-700 border-gray-600 text-white text-sm"
            />
          </div>
          <div>
            <Label htmlFor="end-frame" className="text-xs text-gray-400">End</Label>
            <Input
              id="end-frame"
              type="number"
              min={startFrame}
              max={totalFrames - 1}
              value={endFrame}
              onChange={(e) => onEndFrameChange(Math.min(totalFrames - 1, Math.max(startFrame, parseInt(e.target.value) || startFrame)))}
              onWheel={(e) => handleWheel(e, endFrame, onEndFrameChange, startFrame, totalFrames - 1)}
              className="bg-gray-700 border-gray-600 text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Frame Range Slider */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Range Slider</Label>
        <div className="relative">
          <Slider
            value={[startFrame, endFrame]}
            onValueChange={(value) => {
              onStartFrameChange(value[0]);
              onEndFrameChange(value[1]);
            }}
            min={0}
            max={totalFrames - 1}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{startFrame}</span>
            <span>{endFrame}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
