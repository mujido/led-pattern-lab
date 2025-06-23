import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [playbackSpeed, setPlaybackSpeed] = useState(15);
  const [startFrame, setStartFrame] = useState(0);
  const [endFrame, setEndFrame] = useState(7);

  // Use refs for animation frame tracking
  const animationRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime;
      }

      const deltaTime = currentTime - lastFrameTimeRef.current;
      const frameInterval = 1000 / playbackSpeed; // milliseconds per frame

      if (deltaTime >= frameInterval) {
        // Calculate how many frames to advance
        const framesToAdvance = Math.floor(deltaTime / frameInterval);
        frameCountRef.current += framesToAdvance;

        // Update current frame
        setCurrentFrame(prev => {
          const frameRange = endFrame - startFrame + 1;
          const newFrame = startFrame + (frameCountRef.current % frameRange);
          return newFrame;
        });

        lastFrameTimeRef.current = currentTime;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
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
