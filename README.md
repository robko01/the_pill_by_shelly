# The Pill by Shelly

## About The Pill

[The Pill by Shelly](https://www.shelly.com/products/the-pill-by-shelly?srsltid=AfmBOorrRHmYlzMC7OpB0oEuDmo6hzhuJvCLSSvigVtmT9Bgj4OpY3Hs) is a compact and versatile smart home device that brings automation and control to your fingertips. Designed with flexibility in mind, it integrates seamlessly into Shelly's ecosystem of IoT solutions. The device provides multiple connectivity options and supports various control protocols, making it suitable for diverse automation scenarios. With built-in scripting capabilities, users can implement custom logic and workflows tailored to their specific needs. The Pill functions as a powerful hub for managing multiple devices and automating complex tasks. Its compact form factor makes it easy to deploy in tight spaces while maintaining robust functionality. Whether you're controlling smart home devices, industrial equipment, or robotic systems, The Pill offers the reliability and flexibility required for modern automation. The integration with Shelly's cloud platform provides remote access and monitoring capabilities. Advanced users can leverage the JavaScript scripting engine to create sophisticated automation routines. Combined with its competitive pricing, The Pill represents an excellent solution for DIY enthusiasts and professional integrators alike.

## Robotic Arm Control Implementation

This repository contains a robotic arm control implementation for Shelly devices.

## Project Structure

- `robko01_web_tcm.shelly.js` — TCM endpoint implementation (HTTP API for arm control)
- `robko01_vc_tcm.shelly.js` — Voice control module (virtual components interface)
- `robko01_vc_components.shelly.js` — Setup script that creates virtual UI components (run once)
- `tcm_curl_example.md` — curl API examples
- `tcm_requests_example.md` — Python API examples

## API Documentation & Examples

The robotic arm is controlled via the TCM (Teach/Control Module) endpoint. For detailed information on how to use the API, refer to the example documentation:

- **[curl examples](tcm_curl_example.md)** — Learn how to control the arm using curl commands from the command line
- **[Python examples](tcm_requests_example.md)** — Integrate arm control into Python applications using the requests library

Both examples include complete documentation of all supported commands, parameter configuration, response formats, and working code samples.
