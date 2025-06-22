# LED Pattern Lab - ESP32 Edition

A React-based LED pattern designer that runs on ESP32 with WiFi connectivity and serves a web interface for creating and controlling LED animations.

## Features

- **Web-based LED Designer**: Create LED patterns with a modern React interface
- **ESP32 Integration**: Runs directly on ESP32 hardware with WiFi connectivity
- **GIF/PNG Support**: Import and export LED patterns as GIF or PNG files
- **Real-time Control**: Control LED strips in real-time through the web interface
- **Responsive Design**: Works on desktop and mobile devices
- **SPIFFS Storage**: Web files stored in ESP32's SPIFFS filesystem
- **CMake Integration**: Automatic web build integration with ESP-IDF

## Quick Start

### Prerequisites

1. **ESP-IDF Development Environment**
   ```bash
   source $HOME/esp/esp-idf/export.sh
   ```

2. **Node.js and npm**
   ```bash
   node --version  # Should be v18+
   npm --version   # Should be v8+
   ```

3. **ESP32 Hardware**
   - ESP32 development board
   - WS2812B LED strip (or compatible)
   - USB cable

### Build and Deploy

1. **Source ESP-IDF Environment**
   ```bash
   source $HOME/esp/esp-idf/export.sh
   ```

2. **Build Everything (CMake Integration)**
   ```bash
   ./build-cmake.sh
   ```

3. **Deploy to ESP32**
   ```bash
   ./deploy.sh
   ```

4. **Monitor and Configure**
   ```bash
   idf.py monitor
   ```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Build Options

### Option 1: Integrated CMake Build (Recommended)
```bash
source $HOME/esp/esp-idf/export.sh
./build-cmake.sh
```

### Option 2: Direct ESP-IDF Commands
```bash
source $HOME/esp/esp-idf/export.sh
idf.py build          # Automatically includes web build
idf.py flash spiffs-flash
```

### Option 3: Manual Build Process
```bash
source $HOME/esp/esp-idf/export.sh
./build-web.sh        # Build web only
idf.py build          # Build firmware only
./build-all.sh        # Build everything manually
```

## Development

### Web Development
```bash
cd web
npm install
npm run dev      # Development server
npm run build    # Production build
```

### Firmware Development
```bash
source $HOME/esp/esp-idf/export.sh
idf.py build     # Build firmware (includes web)
idf.py flash     # Flash firmware
idf.py monitor   # Monitor output
```

### Configuration
```bash
source $HOME/esp/esp-idf/export.sh
idf.py menuconfig  # Configure WiFi, LED count, GPIO pin
```

## Project Structure

```
led-pattern-lab/
├── web/                    # React web application
│   ├── src/               # Source code
│   ├── dist/              # Built web files (generated)
│   └── package.json       # Web dependencies
├── main/                  # ESP32 firmware
│   ├── main.cpp          # Main firmware code
│   ├── web/              # Web files for SPIFFS (generated)
│   └── CMakeLists.txt    # Firmware build config
├── build-cmake.sh        # CMake-integrated build script
├── build-all.sh          # Complete build script
├── build-web.sh          # Web-only build script
├── deploy.sh             # Deployment script
├── partitions.csv        # ESP32 partition table
└── CMakeLists.txt        # Project configuration
```

## CMake Integration

The project includes seamless CMake integration that automatically:
- Detects Node.js and npm availability
- Builds the web application during firmware build
- Copies web files to the ESP32 project
- Handles dependencies between web and firmware builds

### CMake Targets
- `web-build`: Builds and copies web files
- `web-clean`: Cleans web build artifacts
- `idf.py build`: Automatically includes web build

## Technologies Used

### Web Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **shadcn/ui** for modern UI components
- **Tailwind CSS** for styling
- **gif.js** and **pngjs** for image processing

### ESP32 Firmware
- **ESP-IDF** framework
- **ESP32 HTTP Server** for web interface
- **SPIFFS** for file storage
- **WiFi** connectivity
- **FastLED** library (planned)

## Performance

- **Web Bundle**: ~700KB (compressed to ~200KB)
- **SPIFFS Usage**: ~700KB of 3MB available
- **Memory**: Optimized for ESP32's limited RAM
- **Network**: Efficient static file serving over WiFi
- **Build Time**: ~3 seconds for web, ~30 seconds for firmware

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `./build-cmake.sh`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
1. Check [DEPLOYMENT.md](DEPLOYMENT.md) for troubleshooting
2. Review ESP-IDF documentation
3. Open an issue on GitHub
