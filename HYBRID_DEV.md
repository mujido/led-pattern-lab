# ESP32 LED Strip Designer - Mode Guide

This project supports three distinct modes based on how you run the application:

## Mode 1: Local Development (`npm run dev`)
- **Storage**: localStorage only
- **Use case**: Local development (Lovable.app, local testing, etc.)
- **ESP32**: Not needed
- **Environment**: No ESP32 URL required

## Mode 2: Hybrid Development (`npm run dev:hybrid`)
- **Storage**: ESP32 REST API
- **Use case**: Development with hot reloading + real ESP32 storage
- **ESP32**: Required and running
- **Environment**: `VITE_ESP32_REST_URL=http://YOUR_ESP32_IP`

## Mode 3: Production Deployment (`npm run build:esp32`)
- **Storage**: ESP32 REST API
- **Use case**: Production deployment on ESP32
- **ESP32**: Serves everything (web files + REST API)
- **Environment**: No ESP32 URL required (uses current host)

## Quick Start

### For Local Development:
```bash
cd web
npm run dev
```
- No environment configuration needed
- Uses localStorage for file storage
- Perfect for Lovable.app, local testing, or offline development

### For Hybrid Development:
```bash
cd web
# Ensure your .env file has: VITE_ESP32_REST_URL=http://YOUR_ESP32_IP
npm run dev:hybrid
```
- Frontend runs on localhost:8080 with hot reloading
- Files are saved/loaded via ESP32 REST API
- Perfect for testing with real hardware

### For Production Deployment:
```bash
cd web
npm run build:esp32
# Then flash to ESP32
cd ..
idf.py build
idf.py flash
```
- Builds optimized files for ESP32
- ESP32 serves everything from SPIFFS

## Environment Configuration

Create a `.env` file in the `web` directory:

```bash
cd web
cp env.example .env
```

For hybrid development, set your ESP32 IP:
```env
VITE_ESP32_REST_URL=http://192.168.87.211
```

## Benefits of Each Mode

### Local Development
- ✅ Fast development (Lovable.app, local testing)
- ✅ No hardware required
- ✅ Instant file operations
- ✅ Works offline
- ❌ No real ESP32 testing

### Hybrid Development
- ✅ Hot reloading for frontend changes
- ✅ Real ESP32 storage testing
- ✅ Fast iteration cycle
- ✅ Debug REST API in browser dev tools
- ❌ Requires ESP32 to be running

### Production Deployment
- ✅ Full ESP32 integration
- ✅ Optimized for production
- ✅ No external dependencies
- ❌ Slower development cycle

## Troubleshooting

### Mode Detection Issues
Check the browser console for mode detection logs:
```
🔧 App Mode Detection: {
  mode: "hybrid_dev",
  description: "Hybrid Development - Local PC + ESP32 REST API",
  storageType: "restApi",
  restApiUrl: "http://192.168.87.211",
  ...
}
```

### REST API Connection Issues
1. Verify ESP32 IP address in `.env` file
2. Ensure ESP32 is running and HTTP server is initialized
3. Check ESP32 console for error messages
4. Verify network connectivity

### File Operations Not Working
1. Check browser console for REST API errors
2. Verify ESP32 SPIFFS is properly initialized
3. Check ESP32 console for file operation errors
