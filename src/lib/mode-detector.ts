/**
 * Mode Detection Utility for ESP32 LED Strip Designer
 *
 * This utility handles three distinct modes based on how the app is run:
 * 1. Local Development: `npm run dev` - Local storage only
 * 2. Hybrid Development: `npm run dev:hybrid` - Local PC + ESP32 REST API
 * 3. Production Deployment: `npm run build:esp32` - ESP32 serves everything
 */

export enum AppMode {
  LOCAL_DEV = 'local_dev',          // Mode 1: Local development with localStorage
  HYBRID_DEV = 'hybrid_dev',        // Mode 2: Hybrid development (local PC + ESP32 REST)
  PRODUCTION = 'production'         // Mode 3: Production deployment on ESP32
}

export interface ModeInfo {
  mode: AppMode;
  description: string;
  storageType: 'localStorage' | 'restApi';
  restApiUrl: string | null;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Detect the current application mode based on Vite mode
 */
export function detectAppMode(): ModeInfo {
  const viteMode = import.meta.env.MODE;

  // Mode 1: Local Development (`npm run dev`)
  if (viteMode === 'dev') {
    return {
      mode: AppMode.LOCAL_DEV,
      description: 'Local Development - Local Storage Only',
      storageType: 'localStorage',
      restApiUrl: null,
      isDevelopment: true,
      isProduction: false
    };
  }

  // Mode 2: Hybrid Development (`npm run dev:hybrid`)
  if (viteMode === 'hybrid') {
    const esp32RestUrl = import.meta.env.VITE_ESP32_REST_URL;
    return {
      mode: AppMode.HYBRID_DEV,
      description: 'Hybrid Development - Local PC + ESP32 REST API',
      storageType: 'restApi',
      restApiUrl: esp32RestUrl || null,
      isDevelopment: true,
      isProduction: false
    };
  }

  // Mode 3: Production Deployment (`npm run build:esp32`)
  if (viteMode === 'production') {
    return {
      mode: AppMode.PRODUCTION,
      description: 'Production Deployment - ESP32 Only',
      storageType: 'restApi',
      restApiUrl: window.location.origin, // Use current host in production
      isDevelopment: false,
      isProduction: true
    };
  }

  // Fallback: Default to local mode
  return {
    mode: AppMode.LOCAL_DEV,
    description: 'Development - Local Storage Only (Fallback)',
    storageType: 'localStorage',
    restApiUrl: null,
    isDevelopment: true,
    isProduction: false
  };
}

/**
 * Get the current mode info
 */
export const currentMode = detectAppMode();

/**
 * Check if we should use REST API for storage
 */
export function shouldUseRestApi(): boolean {
  return currentMode.storageType === 'restApi';
}

/**
 * Get the ESP32 REST API URL for the current mode
 */
export function getRestApiUrl(): string | null {
  return currentMode.restApiUrl;
}

/**
 * Log mode information for debugging
 */
export function logModeInfo(): void {
  console.log('🔧 App Mode Detection:', {
    mode: currentMode.mode,
    description: currentMode.description,
    storageType: currentMode.storageType,
    restApiUrl: currentMode.restApiUrl,
    isDevelopment: currentMode.isDevelopment,
    isProduction: currentMode.isProduction,
    viteMode: import.meta.env.MODE,
    esp32Url: import.meta.env.VITE_ESP32_REST_URL
  });
}
