# Robko01 Shelly Pill Project - Complete Reference

## Overview
This project contains JavaScript scripts for Shelly Gen2/Gen3 smart home devices that control a Robko01 6-DOF robotic arm via the Teach/Control Module (TCM) protocol over UART serial communication.

## Project Structure
```
the_pill_by_shelly/
├── robko01_web_tcm.shelly.js     # HTTP API endpoint for remote control
├── robko01_vc_tcm.shelly.js      # Virtual component UI control
├── robko01_vc_create.shelly.js   # Setup script for virtual UI components
├── robko01_vc_cleanup.shelly.js  # Cleanup script for virtual components
├── robko01_go_for_candy.shelly.js # Demo movement sequence
├── robko01_uart_test.shelly.js   # UART connectivity test
├── tcm_curl_example.md           # API docs with curl examples
├── tcm_requests_example.md       # API docs with Python examples
└── README.md                     # Project documentation
```

## Key Features

**HTTP API Control:**
- REST-like endpoints at `/script/N/tcm`
- Query parameter-based command arguments
- Full TCM command support (step, home, reset, read, gripper)

**Virtual Component UI:**
- Button event handlers for direct device interaction
- Slider controls for joint positioning
- Group organization for logical UI layout

**TCM Protocol:**
- 9600 baud UART communication (8N1)
- Newline-terminated commands
- Bidirectional send/receive for position feedback

## Coding Standards

### Naming Conventions
- **Variables**: `camelCase` (e.g., `lastTime`, `switchStatus`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `BAUD`, `SPEED`, `CLEAR_TIME_S`)
- **Functions**: `camelCase` with descriptive verbs (e.g., `read_arm()`, `close_gripper()`)
- **Event handlers**: Prefix with `on` (e.g., `onDevStatus`)
- **Boolean functions**: Prefix with `is`/`has` (e.g., `isValidMac`)
- **Classes/Namespaces**: `UPPER_CASE` (e.g., `TCM`, `JOINTS`)
- **Private methods**: Underscore prefix (e.g., `_onReceive()`)

### Code Organization
```javascript
/* === CONFIG === */
/* === STATE === */
/* === HELPERS === */
/* === MAIN LOGIC === */
/* === EVENT HANDLERS === */
/* === INITIALIZATION === */
```

### Core Requirements
- "Each script is standalone" - no imports or cross-file dependencies
- Configuration values positioned at file top
- KVS for persistent storage
- Null/undefined property checks before access
- Callback pattern: `function(result, error_code, error_message)`
- Watchdog timer (WDT) for motor safety (60s auto-disable)

## Essential Shelly APIs

| API | Purpose |
|-----|---------|
| `Shelly.call()` | Execute RPC commands |
| `Shelly.addEventHandler()` | Subscribe to device events |
| `Shelly.getComponentStatus()` | Retrieve current state |
| `HTTPServer.registerEndpoint()` | Create HTTP endpoints |
| `Virtual.getHandle()` | Access virtual components |
| `Number.Set()` | Update virtual number values |
| `KVS.Get/Set` | Persistent key-value storage |
| `Timer.set()` | Schedule callbacks |
| `UART` | Serial communication |

## TCM Protocol Commands

| Command | Format | Description |
|---------|--------|-------------|
| `@STEP` | `@STEP vel,b,s,e,p,r,g` | Move joints by step values |
| `@HOME` | `@HOME` | Home all axes |
| `@RESET` | `@RESET` | Reset arm position |
| `@READ` | `@READ` | Read current position |
| `@SET` | `@SET vel` | Set movement speed |
| `@CLOSE` | `@CLOSE` | Close gripper |
| `FREE` | `FREE` | Release all motors |

## Git Workflow

### Branching Strategy
- **main**: Production-ready code, only receives merges from dev
- **dev**: Development branch, created from main, where integration happens
- **feature branches**: Created from dev for each new feature or change

### Branch Naming
- Feature branches: `feature/<short-description>` (e.g., `feature/add-dimmer-support`)
- Bug fixes: `fix/<short-description>` (e.g., `fix/mac-validation`)

## Device Compatibility
- Shelly Gen2/Gen3 devices
- UART-capable devices (The Pill)

## External Hardware
- Robko01 6-DOF Robotic Arm
- TCM (Teach/Control Module)
- The Pill (Shelly device with UART)
