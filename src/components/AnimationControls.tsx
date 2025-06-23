import React, { memo, useCallback } from 'react';
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

// Memoized play button component to prevent unnecessary re-renders
const PlayButton = memo(({ isPlaying, onPlayToggle }: {
  isPlaying: boolean;
  onPlayToggle: () => void;
}) => {
  const Icon = isPlaying ? Pause : Play;

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onPlayToggle();
  }, [onPlayToggle]);

  return (
    <Button
      onClick={handleClick}
      className="w-full"
      type="button"
    >
      <Icon className="w-4 h-4 mr-2" />
      {isPlaying ? 'Pause' : 'Play'}
    </Button>
  );
});

PlayButton.displayName = 'PlayButton';

export const AnimationControls: React.FC<AnimationControlsProps> = memo(({
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
  const handleWheel = useCallback((e: React.WheelEvent, value: number, onChange: (val: number) => void, min: number, max: number) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -1 : 1;
    const newValue = Math.min(max, Math.max(min, value + delta));
    onChange(newValue);
  }, []);

  const handleFrameCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onFrameCountChange(parseInt(e.target.value) || 1);
  }, [onFrameCountChange]);

  const handleCurrentFrameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onCurrentFrameChange(Math.min(totalFrames - 1, Math.max(0, parseInt(e.target.value) || 0)));
  }, [onCurrentFrameChange, totalFrames]);

  const handleStartFrameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onStartFrameChange(Math.min(endFrame, Math.max(0, parseInt(e.target.value) || 0)));
  }, [onStartFrameChange, endFrame]);

  const handleEndFrameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onEndFrameChange(Math.min(totalFrames - 1, Math.max(startFrame, parseInt(e.target.value) || startFrame)));
  }, [onEndFrameChange, totalFrames, startFrame]);

  const handleSpeedChange = useCallback((value: number[]) => {
    onPlaybackSpeedChange(value[0]);
  }, [onPlaybackSpeedChange]);

  const handleRangeSliderChange = useCallback((value: number[]) => {
    onStartFrameChange(value[0]);
    onEndFrameChange(value[1]);
  }, [onStartFrameChange, onEndFrameChange]);

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
          onChange={handleFrameCountChange}
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
          onChange={handleCurrentFrameChange}
          onWheel={(e) => handleWheel(e, currentFrame, onCurrentFrameChange, 0, totalFrames - 1)}
          className="bg-gray-700 border-gray-600 text-white text-center"
        />
      </div>

      {/* Playback Controls - Isolated to prevent event bubbling */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Playback</Label>
        <div onClick={(e) => e.stopPropagation()}>
          <PlayButton isPlaying={isPlaying} onPlayToggle={onPlayToggle} />
        </div>
      </div>

      {/* Playback Speed */}
      <div className="space-y-2">
        <Label className="text-sm text-gray-300">Speed: {playbackSpeed} FPS</Label>
        <Slider
          value={[playbackSpeed]}
          onValueChange={handleSpeedChange}
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
              onChange={handleStartFrameChange}
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
              onChange={handleEndFrameChange}
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
            onValueChange={handleRangeSliderChange}
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
});

AnimationControls.displayName = 'AnimationControls';
