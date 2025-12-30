# TCM endpoint — curl examples

Base URL (domain and script index configurable):

http://the-robk01-pill-by-shelly.local/script/3/tcm

Both domain and script index can be parameterized:

- Domain: `the-robk01-pill-by-shelly.local` (replace with your device's hostname or IP)
- Script index: `3` (replace with the index of your installed JS script)

Examples below show parameterized shell style using `DOMAIN` and `INDEX` variables:

## Supported Commands

Only `step` and `set` accept additional parameters:

| Command | Parameters | Description |
|---------|-----------|-------------|
| `read` | none | Read current arm state |
| `step` | `velocity`, `base`, `shoulder`, `elbow`, `p`, `r`, `gripper` | Move by relative step values |
| `home` | none | Move arm to home position |
| `reset` | none | Reset arm controller |
| `free` | none | Disable motors (arm can be moved manually) |
| `close_gripper` | none | Close the gripper |
| `set` | `velocity` | Set velocity for future steps |

## Response Format

All responses are JSON:

```json
{
  "status": "ok" or "error",
  "message": "Command executed" or error description,
  "response": "controller response",
  "args": { "cmd": "...", ...other params... }
}
```

Examples for each supported command:

- Read current arm state (no parameters)

```bash
DOMAIN="the-robk01-pill-by-shelly.local"
INDEX=3
curl "http://$DOMAIN/script/$INDEX/tcm?cmd=read"
```

- Step (move by relative step values)

```bash
DOMAIN="the-robk01-pill-by-shelly.local"
INDEX=3
curl "http://$DOMAIN/script/$INDEX/tcm?cmd=step&velocity=200&base=10&shoulder=5&elbow=0&p=0&r=0&gripper=0"
```

- Home (move arm to home)

```bash
DOMAIN="the-robk01-pill-by-shelly.local"
INDEX=3
curl "http://$DOMAIN/script/$INDEX/tcm?cmd=home"
```

- Reset (reset arm controller)

```bash
DOMAIN="the-robk01-pill-by-shelly.local"
INDEX=3
curl "http://$DOMAIN/script/$INDEX/tcm?cmd=reset"
```

- Free (disable motors / let arm be moved manually)

```bash
DOMAIN="the-robk01-pill-by-shelly.local"
INDEX=3
curl "http://$DOMAIN/script/$INDEX/tcm?cmd=free"
```

- Close gripper

```bash
DOMAIN="the-robk01-pill-by-shelly.local"
INDEX=3
curl "http://$DOMAIN/script/$INDEX/tcm?cmd=close_gripper"
```

- Set (change velocity for future steps)

```bash
DOMAIN="the-robk01-pill-by-shelly.local"
INDEX=3
curl "http://$DOMAIN/script/$INDEX/tcm?cmd=set&velocity=150"
```

You can adjust numeric parameters as needed. If you want, I can add POST examples or a short script to run multiple commands.

---

[← Back to README](README.md)
