# Contributing

Thanks for contributing to **the_pill_by_shelly**.

## Repo Layout

- `scripts/` contains all Shelly scripts (`*.shelly.js`)
- `tcm_*.md` contains usage examples for the TCM HTTP endpoint
- `AGENTS.md` contains project conventions/coding standards

## Development Workflow

- Base branch for development: `dev`
- Create feature branches from `dev`:
  - `feature/<short-description>`
  - `fix/<short-description>`

Example:

```bash
git checkout dev
git pull
git checkout -b feature/vc-modbus-improvement
```

## Coding Guidelines

Follow `AGENTS.md` for:

- code organization sections (`CONFIG`, `STATE`, `HELPERS`, etc.)
- Shelly JS style (no imports, defensive null checks, callback patterns)
- safety expectations (avoid unsafe motor behavior, include timeouts where appropriate)

## Testing Expectations

Most changes are hardware-dependent.

Before opening a PR:

- Verify the script loads and runs on a device (no startup exceptions).
- Verify the key action paths you touched:
  - VC button handlers fire
  - Modbus/UART requests succeed (or fail gracefully)
  - motors/drives safety behavior works (auto-off/stop paths)
- If you cannot test on hardware, call that out clearly in the PR.

## Commit Messages

Keep messages short and imperative:

- Good: `Add VC+Modbus controller with auto drive on/off`
- Good: `Reorganize Shelly scripts into scripts/`
- Avoid: `WIP`, `Update`, `Fix stuff`

## Pull Requests

- Target: `dev`
- Include:
  - what changed
  - how it was tested (device model, connection type, and a short checklist)
  - any register map assumptions (for Modbus) or VC ID assumptions

## Shelly Script Notes

- Scripts must be standalone and robust to missing Virtual Components.
- Avoid large single RPC payloads when uploading code; chunking may be required.
- Prefer safe defaults:
  - don’t move on boot unless explicitly requested
  - ensure drives are enabled only when needed
  - auto-disable drives on idle where applicable

## File Naming

Use the existing naming pattern:

- `robko01_*` prefix
- keep `.shelly.js` suffix for Shelly scripts
- place scripts under the appropriate `scripts/<area>/` folder

