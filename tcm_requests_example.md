# TCM endpoint — Python `requests` examples

Base URL:

http://the-robk01-pill-by-shelly.local/script/3/tcm

Install `requests`:

```bash
pip install requests
```

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

## Example Usage (GET requests)

```python
import requests

# Configure domain and script index for your Shelly install
DOMAIN = "the-robk01-pill-by-shelly.local"  # change to your device's hostname or IP
SCRIPT_INDEX = 3  # change to the correct index for your device
BASE = f"http://{DOMAIN}/script/{SCRIPT_INDEX}/tcm"

def send_cmd(cmd, params=None):
    params = params or {}
    params["cmd"] = cmd
    r = requests.get(BASE, params=params, timeout=10)
    r.raise_for_status()
    return r.json()

# Read current arm state (no params)
def read():
    return send_cmd("read")

# Step (accepts motion args)
def step(velocity=100, base=0, shoulder=0, elbow=0, p=0, r=0, gripper=0):
    params = {
        "velocity": velocity,
        "base": base,
        "shoulder": shoulder,
        "elbow": elbow,
        "p": p,
        "r": r,
        "gripper": gripper,
    }
    return send_cmd("step", params)

# Home
def home():
    return send_cmd("home")

# Reset
def reset():
    return send_cmd("reset")

# Free
def free():
    return send_cmd("free")

# Close gripper
def close_gripper():
    return send_cmd("close_gripper")

# Set velocity for future steps (accepts velocity)
def set_speed(velocity):
    return send_cmd("set", {"velocity": velocity})

if __name__ == "__main__":
    print("Read:", read())
    print("Set speed to 150:", set_speed(150))
    print("Step example:", step(velocity=200, base=10, shoulder=5))
```

Adjust values as needed. If you want, I can add a small script that sequences commands with pauses or retries.

---

[← Back to README](README.md)