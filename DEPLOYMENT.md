# LED Pattern Lab - ESP32 Deployment Guide

This guide will help you deploy the LED Pattern Lab web application to an ESP32 device.

## Prerequisites

1. **ESP-IDF Development Environment**
   - Install ESP-IDF v5.0 or later
   - Source the ESP-IDF environment:
     ```bash
     source $HOME/esp/esp-idf/export.sh
     # or
     . $HOME/esp/esp-idf/export.sh
     ```

2. **Node.js and npm**
   - Install Node.js v18 or later
   - Verify installation: `node --version` and `npm --version`

3. **ESP32 Hardware**
   - ESP32 development board
   - USB cable for programming
   - LED strip (WS2812B or compatible)

## Quick Start

### 1. Source ESP-IDF Environment
```bash
source $HOME/esp/esp-idf/export.sh
```

### 2. Build Everything (CMake Integration)
```bash
./build-cmake.sh
```
This script will:
- Automatically build the React web app
- Copy web files to the ESP32 project
- Build the ESP32 firmware
- All in one integrated CMake build process

### 3. Deploy to ESP32
```bash
./deploy.sh
```
This script will:
- Flash the firmware to the ESP32
- Flash the web files to SPIFFS

### 4. Monitor and Configure
```bash
idf.py monitor
```
- Watch the boot process
- Note the IP address when WiFi connects
- Open the web interface in your browser

## Build Options

### Option 1: Integrated CMake Build (Recommended)
```bash
# Source ESP-IDF first
source $HOME/esp/esp-idf/export.sh

# Build everything with CMake integration
./build-cmake.sh
```

### Option 2: Manual Build Process
```bash
# Source ESP-IDF first
source $HOME/esp/esp-idf/export.sh

# Build web app only
./build-web.sh

# Build firmware only
idf.py build

# Or build everything manually
./build-all.sh
```

### Option 3: Direct ESP-IDF Commands
```bash
# Source ESP-IDF first
source $HOME/esp/esp-idf/export.sh

# Build with CMake (automatically includes web build)
idf.py build

# Flash components
idf.py flash spiffs-flash
```

## Configuration

### WiFi Setup
The ESP32 will create an access point on first boot. Connect to it and configure your WiFi credentials through the web interface.

### LED Configuration
Configure LED settings through `idf.py menuconfig`:
- **Number of LEDs**: Set the total number of LEDs in your strip
- **GPIO Pin**: Set the GPIO pin connected to the LED data line

### Partition Table
The project uses a custom partition table (`partitions.csv`):
- **Factory**: 1MB for firmware
- **SPIFFS**: ~3MB for web files
- **NVS**: 24KB for configuration

## File Structure

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

The project includes CMake integration that automatically:
- Detects Node.js and npm availability
- Builds the web application during firmware build
- Copies web files to the ESP32 project
- Handles dependencies between web and firmware builds

### CMake Targets
- `web-build`: Builds and copies web files
- `web-clean`: Cleans web build artifacts
- `idf.py build`: Automatically includes web build

### Environment Requirements
- ESP-IDF environment must be sourced externally
- Node.js and npm must be available in PATH
- Web build will be skipped if dependencies are missing

## Troubleshooting

### Build Issues
- **ESP-IDF not found**: Make sure to source the ESP-IDF environment first
- **Node.js not found**: Install Node.js and npm
- **Permission denied**: Make scripts executable with `chmod +x *.sh`
- **CMake build fails**: Check that ESP-IDF is properly sourced

### Flash Issues
- **Device not found**: Check USB connection and drivers
- **Flash failed**: Try erasing flash first: `idf.py erase-flash`
- **SPIFFS mount failed**: Check partition table configuration

### Runtime Issues
- **WiFi not connecting**: Check credentials and signal strength
- **Web interface not loading**: Verify SPIFFS flash was successful
- **LEDs not responding**: Check GPIO pin configuration and wiring

### Web Build Issues
- **Dependencies missing**: Run `cd web && npm install`
- **Build errors**: Check for TypeScript/ESLint errors
- **Large bundle size**: The current build is optimized for ESP32 deployment

## Development Workflow

1. **Setup Environment**:
   ```bash
   source $HOME/esp/esp-idf/export.sh
   ```

2. **Web Development**:
   ```bash
   cd web
   npm run dev          # Development server
   npm run build        # Production build
   ```

3. **Firmware Development**:
   ```bash
   idf.py build         # Build firmware (includes web)
   idf.py flash         # Flash firmware
   idf.py monitor       # Monitor output
   ```

4. **Full Deployment**:
   ```bash
   ./build-cmake.sh     # Build everything
   ./deploy.sh          # Deploy to ESP32
   ```

## Performance Notes

- **Web Bundle Size**: ~700KB (compressed to ~200KB)
- **SPIFFS Usage**: ~700KB of 3MB available
- **Memory Usage**: Optimized for ESP32's limited RAM
- **Network**: Serves static files efficiently over WiFi
- **Build Time**: ~3 seconds for web, ~30 seconds for firmware

## Security Considerations

- WiFi credentials are stored in NVS (non-volatile storage)
- Web interface is served over HTTP (not HTTPS)
- No authentication required for web interface
- Consider adding security measures for production use

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review ESP-IDF documentation
3. Check the project README for additional details
