# The Pill by Shelly

## About The Pill

[The Pill by Shelly](https://www.shelly.com/products/the-pill-by-shelly) is a compact and versatile smart home device that brings automation and control to your fingertips. Designed with flexibility in mind, it integrates seamlessly into Shelly's ecosystem of IoT solutions. The device provides multiple connectivity options and supports various control protocols, making it suitable for diverse automation scenarios. With built-in scripting capabilities, users can implement custom logic and workflows tailored to their specific needs.

## Robotic Arm Control Implementation

This repository contains a robotic arm control implementation for Shelly devices, enabling control of a Robko01 6-DOF robotic arm via the Teach/Control Module (TCM) protocol over UART serial communication.

## Project Structure

```
the_pill_by_shelly/
├── robko01_web_tcm.shelly.js     # HTTP API endpoint for remote arm control
├── robko01_vc_tcm.shelly.js      # Virtual component UI control
├── robko01_vc_create.shelly.js   # Setup script for virtual UI components (run once)
├── robko01_vc_cleanup.shelly.js  # Cleanup script for virtual components
├── robko01_go_for_candy.shelly.js # Demo movement sequence
├── robko01_uart_test.shelly.js   # UART connectivity test
├── tcm_curl_example.md           # API docs with curl examples
├── tcm_requests_example.md       # API docs with Python examples
├── CLAUDE.md                     # Project coding standards and conventions
└── README.md                     # Project documentation
```

## Key Features

- **HTTP API Control**: REST-like endpoints at `/script/N/tcm` for remote arm control
- **Virtual Component UI**: Button and slider controls for direct device interaction
- **Demo Sequences**: Pre-programmed movement routines for demonstration
- **Safety Features**: Watchdog timer (WDT) auto-disables motors after 60s of inactivity

## API Documentation & Examples

The robotic arm is controlled via the TCM (Teach/Control Module) endpoint. For detailed information on how to use the API, refer to the example documentation:

- **[curl examples](tcm_curl_example.md)** — Control the arm using curl commands from the command line
- **[Python examples](tcm_requests_example.md)** — Integrate arm control into Python applications using the requests library

Both examples include complete documentation of all supported commands, parameter configuration, response formats, and working code samples.

## TCM Protocol Commands

| Command | Description |
|---------|-------------|
| `step` | Move joints by step values |
| `home` | Home all axes |
| `reset` | Reset arm position |
| `read` | Read current position |
| `set` | Set movement speed |
| `close` | Close gripper |
| `free` | Release all motors |

## Hardware Requirements

- Shelly Gen2/Gen3 device with UART (The Pill)
- Robko01 6-DOF Robotic Arm
- TCM (Teach/Control Module)

## Getting Started

1. Upload `robko01_vc_create.shelly.js` and run it once to create virtual UI components
2. Upload `robko01_web_tcm.shelly.js` for HTTP API control, or `robko01_vc_tcm.shelly.js` for UI control
3. Connect the Shelly device to the TCM via UART (9600 baud, 8N1)
4. Use the API or UI to control the robotic arm

## Development

See [CLAUDE.md](CLAUDE.md) for coding standards, naming conventions, and contribution guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.
