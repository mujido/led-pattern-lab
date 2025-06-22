# LED Matrix Designer

A React-based LED matrix designer that communicates with LED hardware via WebSocket API. The web interface allows you to create, edit, and control LED patterns in real-time.

## Project Structure

This project is organized into two main components:

- **LED Matrix Designer** (`led-pattern-lab/`): The React-based web interface for designing LED patterns
- **ESP32 LED Matrix Driver** (`esp32_led_strip_designer/`): An example implementation using ESP32 hardware

## Features

- **Web-based LED Designer**: Create LED patterns with a modern React interface
- **Real-time Control**: Control LED strips in real-time through WebSocket communication
- **GIF/PNG Support**: Import and export LED patterns as GIF or PNG files
- **Responsive Design**: Works on desktop and mobile devices
- **Hardware Agnostic**: Uses WebSocket API that can work with any compatible backend

## WebSocket API Protocol

The LED Matrix Designer communicates with LED hardware using a WebSocket API. The protocol supports:

### Connection
- **URL**: `ws://[device-ip]:8080/ws`
- **Protocol**: Binary WebSocket messages

### Message Format
All messages use a binary format with the following structure:
```
[Command Byte][Length][Data...]
```

### Commands

#### 0x01 - Set LED Color
Sets a single LED to a specific color.
```
[0x01][4 bytes][LED Index (2 bytes)][RGB Color (3 bytes)]
```

#### 0x02 - Set Multiple LEDs
Sets multiple LEDs to specific colors.
```
[0x02][Length][LED Data...]
```
Where LED Data is: `[Index (2 bytes)][RGB (3 bytes)]` repeated for each LED.

#### 0x03 - Clear All LEDs
Turns off all LEDs.
```
[0x03][0 bytes]
```

#### 0x04 - Set Brightness
Sets the overall brightness (0-255).
```
[0x04][1 byte][Brightness]
```

#### 0x05 - Get LED Count
Requests the total number of LEDs.
```
[0x05][0 bytes]
```

#### 0x06 - LED Count Response
Response with the total number of LEDs.
```
[0x06][2 bytes][LED Count]
```

### Example Implementation
The ESP32 LED Matrix Driver provides a complete implementation of this protocol, but you can implement it on any platform that supports WebSockets.

## Quick Start

### Prerequisites

1. **Node.js and npm** (for web development)
   ```bash
   node --version  # Should be v18+
   npm --version   # Should be v8+
   ```

2. **LED Hardware** (optional)
   - Any hardware that implements the WebSocket API
   - ESP32 with WS2812B LED strip (example implementation)

### Web Development

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Development Server**
   ```bash
   npm run dev
   ```

3. **Production Build**
   ```bash
   npm run build
   ```

### Hardware Implementation

For an example ESP32 implementation, see the [ESP32 LED Matrix Driver README](esp32_led_strip_designer/README.md).

## Development

### Web Development
```bash
npm install
npm run dev      # Development server
npm run build    # Production build
```

### Testing with Mock Hardware
The web interface includes a mock mode for testing without hardware:
```bash
npm run dev
# Open browser and enable "Mock Mode" in settings
```

## Project Structure

```
led-pattern-lab/
├── src/                    # React web application source
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── lib/              # Utility libraries
│   │   └── websocket.ts  # WebSocket API implementation
│   └── main.tsx          # Application entry point
├── public/               # Static assets
├── package.json          # Web dependencies
├── esp32_led_strip_designer/  # Example ESP32 implementation
│   ├── main/             # ESP32 source code
│   ├── web/              # Web files for SPIFFS (generated)
│   ├── CMakeLists.txt    # ESP32 build configuration
│   └── README.md         # ESP32-specific documentation
└── README.md             # This file
```

## Technologies Used

### Web Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **shadcn/ui** for modern UI components
- **Tailwind CSS** for styling
- **gif.js** and **pngjs** for image processing
- **WebSocket API** for real-time communication

### Example Hardware Implementation
- **ESP-IDF** framework (ESP32 example)
- **ESP32 HTTP Server** for web interface
- **WebSocket Server** for real-time communication
- **SPIFFS** for file storage (ESP32 example)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both web and hardware components
5. Submit a pull request

## Credits

This project was developed with the assistance of:
- **[lovable.dev](https://lovable.dev)** - AI-powered development platform that helped create the initial React web interface
- **[Cursor](https://cursor.sh)** - AI-powered IDE that hosted the development environment and AI assistant
- **Claude Sonnet 4** - AI assistant that helped with project organization, documentation, and WebSocket API design

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
1. Check the [ESP32 LED Matrix Driver README](esp32_led_strip_designer/README.md) for the example implementation
2. Review the WebSocket API documentation above
3. Open an issue on GitHub
