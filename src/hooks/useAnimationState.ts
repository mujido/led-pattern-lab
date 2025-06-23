
import { useState, useEffect, useCallback } from 'react';

export interface AnimationState {
  totalFrames: number;
  currentFrame: number;
  isPlaying: boolean;
  playbackSpeed: number;
  startFrame: number;
  endFrame: number;
}

export const useAnimationState = () => {
  const [totalFrames, setTotalFrames] = useState(8);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(7);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        return next > endFrame ? startFrame : next;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, startFrame, endFrame]);

  const handlePlayToggle = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleFrameCountChange = useCallback((newFrameCount: number, rows: number, columns: number, setLedFrames: React.Dispatch<React.SetStateAction<string[][][]>>) => {
    setTotalFrames(newFrameCount);
    setLedFrames(prev => {
      if (newFrameCount > prev.length) {
        const newFrames = [...prev];
        for (let i = prev.length; i < newFrameCount; i++) {
          newFrames.push(Array(rows).fill(null).map(() => Array(columns).fill('#000000')));
        }
        return newFrames;
      } else {
        return prev.slice(0, newFrameCount);
      }
    });

    if (currentFrame >= newFrameCount) {
      setCurrentFrame(newFrameCount - 1);
    }

    if (endFrame >= newFrameCount) {
      setEndFrame(newFrameCount - 1);
    }
    if (startFrame >= newFrameCount) {
      setStartFrame(0);
    }
  }, [currentFrame, endFrame, startFrame]);

  return {
    totalFrames,
    currentFrame,
    isPlaying,
    playbackSpeed,
    startFrame,
    endFrame,
    setTotalFrames,
    setCurrentFrame,
    setIsPlaying,
    setPlaybackSpeed,
    setStartFrame,
    setEndFrame,
    handlePlayToggle,
    handleFrameCountChange
  };
};
