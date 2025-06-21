import GIF from 'gif.js';
import gifFrames from 'gif-frames';
import { PNG } from 'pngjs';
import { Buffer } from 'buffer';

export interface FrameData {
  width: number;
  height: number;
  pixels: string[][]; // 2D array of hex colors
  delay?: number; // frame delay in ms
}

export interface ImageFormat {
  type: 'gif' | 'png' | 'apng';
  frames: FrameData[];
}

// Convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

// Convert RGB to hex
function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0');
}

// Convert 2D color array to ImageData
function colorArrayToImageData(pixels: string[][], width: number, height: number): ImageData {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const color = pixels[y]?.[x] || '#000000';
      const rgb = hexToRgb(color);
      const index = (y * width + x) * 4;
      imageData.data[index] = rgb.r;
      imageData.data[index + 1] = rgb.g;
      imageData.data[index + 2] = rgb.b;
      imageData.data[index + 3] = 255; // alpha
    }
  }

  return imageData;
}

// Convert ImageData to 2D color array
function imageDataToColorArray(imageData: ImageData): string[][] {
  const pixels: string[][] = [];

  for (let y = 0; y < imageData.height; y++) {
    pixels[y] = [];
    for (let x = 0; x < imageData.width; x++) {
      const index = (y * imageData.width + x) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      pixels[y][x] = rgbToHex(r, g, b);
    }
  }

  return pixels;
}

function scaleCanvas(sourceCanvas: HTMLCanvasElement, targetWidth: number, targetHeight: number): HTMLCanvasElement {
  const targetCanvas = document.createElement('canvas');
  targetCanvas.width = targetWidth;
  targetCanvas.height = targetHeight;
  const ctx = targetCanvas.getContext('2d')!;

  // Disable image smoothing to preserve pixel art style
  ctx.imageSmoothingEnabled = false;

  ctx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);

  return targetCanvas;
}

// Load GIF file and extract frames
export async function loadGif(file: File, targetWidth: number, targetHeight: number, cumulative: boolean): Promise<ImageFormat> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        await gifFrames({
          url: URL.createObjectURL(file),
          frames: 'all',
          outputType: 'canvas',
          cumulative,
        }).then(frames => {
          const frameData: FrameData[] = frames.map((frame: any) => {
            const sourceCanvas = frame.getImage();
            const scaledCanvas = scaleCanvas(sourceCanvas, targetWidth, targetHeight);
            const ctx = scaledCanvas.getContext('2d')!;
            const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

            return {
              width: targetWidth,
              height: targetHeight,
              pixels: imageDataToColorArray(imageData),
              delay: frame.frameInfo?.delay * 10 || 100,
            };
          });

          resolve({
            type: 'gif',
            frames: frameData
          });
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Load PNG file (single frame or APNG)
export async function loadPng(file: File, targetWidth: number, targetHeight: number): Promise<ImageFormat> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = Buffer.from(e.target?.result as ArrayBuffer);
        const png = PNG.sync.read(buffer);

        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = png.width;
        sourceCanvas.height = png.height;
        const sourceCtx = sourceCanvas.getContext('2d')!;
        const sourceImageData = sourceCtx.createImageData(png.width, png.height);
        sourceImageData.data.set(png.data);
        sourceCtx.putImageData(sourceImageData, 0, 0);

        const scaledCanvas = scaleCanvas(sourceCanvas, targetWidth, targetHeight);
        const ctx = scaledCanvas.getContext('2d')!;
        const scaledImageData = ctx.getImageData(0, 0, targetWidth, targetHeight);

        resolve({
          type: 'png',
          frames: [{
            width: targetWidth,
            height: targetHeight,
            pixels: imageDataToColorArray(scaledImageData)
          }]
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Save frames as GIF
export async function saveAsGif(frames: FrameData[], filename: string = 'animation.gif'): Promise<void> {
  return new Promise((resolve, reject) => {
    const gif = new GIF({
      workers: 2,
      quality: 10,
      width: frames[0]?.width || 16,
      height: frames[0]?.height || 8
    });

    frames.forEach((frame) => {
      const imageData = colorArrayToImageData(frame.pixels, frame.width, frame.height);
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d')!;
      ctx.putImageData(imageData, 0, 0);

      gif.addFrame(canvas, {
        delay: frame.delay || 100,
        copy: true,
      });
    });

    gif.on('finished', (blob: Blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      resolve();
    });

    gif.on('error', reject);
    gif.render();
  });
}

// Save frames as PNG (single frame for now)
export async function saveAsPng(frames: FrameData[], filename: string = 'animation.png'): Promise<void> {
  if (frames.length === 0) {
    throw new Error('No frames to save');
  }

  const frame = frames[0]; // Save first frame for now
  const png = new PNG({
    width: frame.width,
    height: frame.height
  });

  for (let y = 0; y < frame.height; y++) {
    for (let x = 0; x < frame.width; x++) {
      const color = frame.pixels[y]?.[x] || '#000000';
      const rgb = hexToRgb(color);
      const index = (y * frame.width + x) * 4;
      png.data[index] = rgb.r;
      png.data[index + 1] = rgb.g;
      png.data[index + 2] = rgb.b;
      png.data[index + 3] = 255; // alpha
    }
  }

  const buffer = PNG.sync.write(png);
  const blob = new Blob([buffer], { type: 'image/png' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Detect file type
export function detectFileType(file: File): 'gif' | 'png' | 'unknown' {
  if (file.type === 'image/gif') return 'gif';
  if (file.type === 'image/png') return 'png';
  return 'unknown';
}
