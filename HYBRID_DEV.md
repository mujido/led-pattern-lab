# Hybrid Development Setup

This setup allows you to develop the frontend with hot reloading while using the ESP32 for file management via REST API.

## How It Works

- **Frontend**: Runs on localhost:8080 with hot reloading
- **ESP32**: Serves static files and provides REST API for file management
- **Storage**: ESP32 storage only (no localStorage backup)

## Setup Instructions

### 1. Configure ESP32 REST API URL

Create a `.env` file in the `web` directory:

```bash
cd web
cp env.example .env
```

Then edit `.env` and update the ESP32 IP address:

```env
# ESP32 REST API URL for hybrid development mode
VITE_ESP32_REST_URL=http://YOUR_ESP32_IP
```

### 2. Start Development Server

```bash
cd web
npm run dev:hybrid
```

This will start the frontend on `http://localhost:8080`

### 3. Build and Flash ESP32

```bash
# Build the ESP32 firmware
idf.py build

# Flash to ESP32
idf.py flash

# Monitor ESP32 output
idf.py monitor
```

### 4. Access the Application

- **Development Mode**: `http://localhost:8080` (hot reloading + ESP32 REST API)
- **Production Mode**: `http://YOUR_ESP32_IP` (ESP32 serves everything)

## Development Workflow

1. **Frontend Development**: Edit React components in `web/src/` - changes will hot reload
2. **File Management**: Files are saved/loaded via REST API to ESP32
3. **Testing**: Test file operations with real ESP32 storage
4. **Deployment**: Build for ESP32 with `npm run build:esp32`

## Modes

### Development Mode (`npm run dev:hybrid`)
- Frontend: Localhost:8080 with hot reloading
- Storage: ESP32 only (no localStorage)
- File Operations: REST API to ESP32
- Configuration: Uses `.env` file for ESP32 REST API URL

### Production Mode (`npm run build:esp32`)
- Frontend: Served by ESP32 from SPIFFS
- Storage: ESP32 only
- File Operations: REST API to ESP32

## Environment Variables

The hybrid mode uses the following environment variable:

- `VITE_ESP32_REST_URL`: REST API URL for ESP32 communication
  - Example: `http://192.168.1.100`
  - No default fallback

## Troubleshooting

### REST API Connection Issues
1. Check ESP32 IP address in `.env` file
2. Ensure ESP32 is running and HTTP server is initialized
3. Check browser console for connection errors

### File Operations Not Working
1. Verify ESP32 HTTP server is responding
2. Check ESP32 console for error messages
3. Ensure SPIFFS is properly initialized

### Hot Reload Not Working
1. Make sure you're using `npm run dev:hybrid`
2. Check that Vite dev server is running on port 8080
3. Verify no CORS issues in browser console

### Environment Variable Issues
1. Ensure `.env` file exists in the `web` directory
2. Check that `VITE_ESP32_REST_URL` is set correctly
3. Restart the development server after changing `.env`

## Benefits

- **Fast Development**: Hot reloading for frontend changes
- **Real Testing**: File operations use actual ESP32 storage
- **Easy Deployment**: Same codebase works for both dev and production
- **Debugging**: Can inspect REST API communication in browser dev tools
- **Clean Configuration**: No hardcoded IP addresses in source code
