/**
 * @title Robko01 VC + MODBUS-RTU controller
 * @description Uses Shelly Virtual Components to control Robko01 over MODBUS-RTU.
 */

/* === CONFIG === */
var CONFIG = {
  BAUD_RATE: 9600,
  MODE: "8N1",
  SLAVE_ID: 1,
  RESPONSE_TIMEOUT: 2000,
  POLL_INTERVAL: 2000,
  AUTO_ENABLE_MOTORS: true,
  AUTO_DISABLE_MOTORS: true,
  // Drives OFF when the robot has been idle (no position change) for this long.
  IDLE_OFF_DELAY_S: 20,
  // If RobotBusy is stuck true, we still allow auto-off if there is no movement for this grace window.
  MOVING_GRACE_S: 6,
  DEBUG: true
};

/* === REGISTER MAP === */
var REG = {
  CURRENT_POS: 0,      // 0..5
  TARGET_POS: 6,       // 6..11
  MOTORS_ENABLED: 12,  // 12
  ROBOT_BUSY: 13,      // 13
  MAX_SPEED: 14,       // 14..19
  START_MOTION: 20,    // 20
  STOP_MOTION: 21,     // 21
  JOINT_COUNT: 6
};

/* === MODBUS FUNCTION CODES === */
var FC = {
  READ_HOLDING_REGISTERS: 0x03,
  WRITE_SINGLE_REGISTER: 0x06,
  WRITE_MULTIPLE_REGISTERS: 0x10
};

/* === VIRTUAL COMPONENTS === */
function firstVC(keys) {
  var i;
  for (i = 0; i < keys.length; i++) {
    var h = Virtual.getHandle(keys[i]);
    if (h) return h;
  }
  return null;
}

// Commands
var VC_BTN_ENABLE = firstVC(["button:300"]);
var VC_BTN_DISABLE = firstVC(["button:301"]);
var VC_BTN_MOVE = firstVC(["button:302", "button:200"]);
var VC_BTN_CLEAR = firstVC(["button:307", "button:201"]);
var VC_BTN_STOP = firstVC(["button:303"]);
var VC_BTN_HOME = firstVC(["button:304"]);
var VC_BTN_READ = firstVC(["button:305"]);

// Target positions (steps)
var VC_J1 = firstVC(["number:300", "number:200"]);
var VC_J2 = firstVC(["number:301", "number:201"]);
var VC_J3 = firstVC(["number:302", "number:202"]);
var VC_J4 = firstVC(["number:303", "number:203"]);
var VC_J5 = firstVC(["number:304", "number:204"]);
var VC_J6 = firstVC(["number:305", "number:205"]);

// Per-joint max speed (steps/s)
var VC_S1 = Virtual.getHandle("number:310");
var VC_S2 = Virtual.getHandle("number:311");
var VC_S3 = Virtual.getHandle("number:312");
var VC_S4 = Virtual.getHandle("number:313");
var VC_S5 = Virtual.getHandle("number:314");
var VC_S6 = Virtual.getHandle("number:315");
var VC_BTN_WRITE_SPEEDS = Virtual.getHandle("button:306");

// Status mirrors
var VC_POS1 = Virtual.getHandle("number:320");
var VC_POS2 = Virtual.getHandle("number:321");
var VC_POS3 = Virtual.getHandle("number:322");
var VC_POS4 = Virtual.getHandle("number:323");
var VC_POS5 = Virtual.getHandle("number:324");
var VC_POS6 = Virtual.getHandle("number:325");
var VC_BUSY = Virtual.getHandle("boolean:300");
var VC_MOTORS = Virtual.getHandle("boolean:301");

/* === CRC TABLE === */
var CRC_TABLE = [
  0x0000, 0xC0C1, 0xC181, 0x0140, 0xC301, 0x03C0, 0x0280, 0xC241,
  0xC601, 0x06C0, 0x0780, 0xC741, 0x0500, 0xC5C1, 0xC481, 0x0440,
  0xCC01, 0x0CC0, 0x0D80, 0xCD41, 0x0F00, 0xCFC1, 0xCE81, 0x0E40,
  0x0A00, 0xCAC1, 0xCB81, 0x0B40, 0xC901, 0x09C0, 0x0880, 0xC841,
  0xD801, 0x18C0, 0x1980, 0xD941, 0x1B00, 0xDBC1, 0xDA81, 0x1A40,
  0x1E00, 0xDEC1, 0xDF81, 0x1F40, 0xDD01, 0x1DC0, 0x1C80, 0xDC41,
  0x1400, 0xD4C1, 0xD581, 0x1540, 0xD701, 0x17C0, 0x1680, 0xD641,
  0xD201, 0x12C0, 0x1380, 0xD341, 0x1100, 0xD1C1, 0xD081, 0x1040,
  0xF001, 0x30C0, 0x3180, 0xF141, 0x3300, 0xF3C1, 0xF281, 0x3240,
  0x3600, 0xF6C1, 0xF781, 0x3740, 0xF501, 0x35C0, 0x3480, 0xF441,
  0x3C00, 0xFCC1, 0xFD81, 0x3D40, 0xFF01, 0x3FC0, 0x3E80, 0xFE41,
  0xFA01, 0x3AC0, 0x3B80, 0xFB41, 0x3900, 0xF9C1, 0xF881, 0x3840,
  0x2800, 0xE8C1, 0xE981, 0x2940, 0xEB01, 0x2BC0, 0x2A80, 0xEA41,
  0xEE01, 0x2EC0, 0x2F80, 0xEF41, 0x2D00, 0xEDC1, 0xEC81, 0x2C40,
  0xE401, 0x24C0, 0x2580, 0xE541, 0x2700, 0xE7C1, 0xE681, 0x2640,
  0x2200, 0xE2C1, 0xE381, 0x2340, 0xE101, 0x21C0, 0x2080, 0xE041,
  0xA001, 0x60C0, 0x6180, 0xA141, 0x6300, 0xA3C1, 0xA281, 0x6240,
  0x6600, 0xA6C1, 0xA781, 0x6740, 0xA501, 0x65C0, 0x6480, 0xA441,
  0x6C00, 0xACC1, 0xAD81, 0x6D40, 0xAF01, 0x6FC0, 0x6E80, 0xAE41,
  0xAA01, 0x6AC0, 0x6B80, 0xAB41, 0x6900, 0xA9C1, 0xA881, 0x6840,
  0x7800, 0xB8C1, 0xB981, 0x7940, 0xBB01, 0x7BC0, 0x7A80, 0xBA41,
  0xBE01, 0x7EC0, 0x7F80, 0xBF41, 0x7D00, 0xBDC1, 0xBC81, 0x7C40,
  0xB401, 0x74C0, 0x7580, 0xB541, 0x7700, 0xB7C1, 0xB681, 0x7640,
  0x7200, 0xB2C1, 0xB381, 0x7340, 0xB101, 0x71C0, 0x7080, 0xB041,
  0x5000, 0x90C1, 0x9181, 0x5140, 0x9301, 0x53C0, 0x5280, 0x9241,
  0x9601, 0x56C0, 0x5780, 0x9741, 0x5500, 0x95C1, 0x9481, 0x5440,
  0x9C01, 0x5CC0, 0x5D80, 0x9D41, 0x5F00, 0x9FC1, 0x9E81, 0x5E40,
  0x5A00, 0x9AC1, 0x9B81, 0x5B40, 0x9901, 0x59C0, 0x5880, 0x9841,
  0x8801, 0x48C0, 0x4980, 0x8941, 0x4B00, 0x8BC1, 0x8A81, 0x4A40,
  0x4E00, 0x8EC1, 0x8F81, 0x4F40, 0x8D01, 0x4DC0, 0x4C80, 0x8C41,
  0x4400, 0x84C1, 0x8581, 0x4540, 0x8701, 0x47C0, 0x4680, 0x8641,
  0x8201, 0x42C0, 0x4380, 0x8341, 0x4100, 0x81C1, 0x8081, 0x4040
];

/* === STATE === */
var state = {
  uart: null,
  rxBuffer: [],
  isReady: false,
  pendingRequest: null,
  responseTimer: null,
  queue: [],
  drainTimer: null,
  pollTimer: null,
  uptime_s: 0,
  last_activity_s: 0,
  motorsEnabled: null,
  robotBusy: null,
  idleTimer: null,
  last_pos: null,
  last_pos_change_s: 0
};

function debug(msg) {
  if (CONFIG.DEBUG) print("[VC-MODBUS] " + msg);
}

function markActivity() {
  state.last_activity_s = state.uptime_s;
}

function posChanged(a, b) {
  if (!a || !b) return true;
  if (a.length !== b.length) return true;
  for (var i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return true;
  }
  return false;
}

function toSigned(v) {
  return v > 32767 ? v - 65536 : v;
}

function toUnsigned(v) {
  return v & 0xFFFF;
}

function bytesToStr(bytes) {
  var s = "";
  for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i] & 0xFF);
  return s;
}

function calcCRC(bytes) {
  var crc = 0xFFFF;
  for (var i = 0; i < bytes.length; i++) {
    var idx = (crc ^ bytes[i]) & 0xFF;
    crc = (crc >> 8) ^ CRC_TABLE[idx];
  }
  return crc;
}

function buildFrame(slave, fc, data) {
  var frame = [slave & 0xFF, fc & 0xFF];
  var i;
  if (data) for (i = 0; i < data.length; i++) frame.push(data[i] & 0xFF);
  var crc = calcCRC(frame);
  frame.push(crc & 0xFF);
  frame.push((crc >> 8) & 0xFF);
  return frame;
}

function clearRespTimeout() {
  if (state.responseTimer) {
    Timer.clear(state.responseTimer);
    state.responseTimer = null;
  }
}

function getExpectedLength(fc) {
  if (fc === FC.READ_HOLDING_REGISTERS) {
    if (state.rxBuffer.length >= 3) return 3 + state.rxBuffer[2] + 2;
    return 0;
  }
  if (fc === FC.WRITE_SINGLE_REGISTER || fc === FC.WRITE_MULTIPLE_REGISTERS) return 8;
  return 0;
}

var processQueue;

function sendRequest(functionCode, data, callback) {
  if (!state.isReady) {
    callback("UART not ready", null);
    return;
  }
  if (state.pendingRequest) {
    callback("Request pending", null);
    return;
  }

  state.pendingRequest = { functionCode: functionCode, callback: callback };
  state.rxBuffer = [];

  var frame = buildFrame(CONFIG.SLAVE_ID, functionCode, data);
  state.responseTimer = Timer.set(CONFIG.RESPONSE_TIMEOUT, false, function() {
    if (!state.pendingRequest) return;
    var cb = state.pendingRequest.callback;
    state.pendingRequest = null;
    cb("Timeout", null);
    scheduleDrain();
  });
  state.uart.write(bytesToStr(frame));
}

function processResponse() {
  if (!state.pendingRequest) {
    state.rxBuffer = [];
    return;
  }
  if (state.rxBuffer.length < 5) return;

  var fc = state.rxBuffer[1];
  if (fc & 0x80) {
    if (state.rxBuffer.length >= 5) {
      clearRespTimeout();
      var exCode = state.rxBuffer[2];
      var cbx = state.pendingRequest.callback;
      state.pendingRequest = null;
      state.rxBuffer = [];
      cbx("Exception 0x" + exCode, null);
      scheduleDrain();
    }
    return;
  }

  var expected = getExpectedLength(fc);
  if (expected === 0 || state.rxBuffer.length < expected) return;

  var frame = state.rxBuffer.slice(0, expected);
  var crc = calcCRC(frame.slice(0, expected - 2));
  var recv = frame[expected - 2] | (frame[expected - 1] << 8);
  if (crc !== recv) {
    debug("CRC mismatch");
    return;
  }

  clearRespTimeout();
  var data = frame.slice(2, expected - 2);
  var cb = state.pendingRequest.callback;
  state.pendingRequest = null;
  state.rxBuffer = [];

  Timer.set(1, false, function() {
    cb(null, data);
    scheduleDrain();
  });
}

function onReceive(chunk) {
  if (!chunk || chunk.length === 0) return;
  for (var i = 0; i < chunk.length; i++) state.rxBuffer.push(chunk.charCodeAt(i) & 0xFF);
  processResponse();
}

processQueue = function() {
  if (state.pendingRequest || state.queue.length === 0) return;
  var req = state.queue.splice(0, 1)[0];
  sendRequest(req.fc, req.data, req.cb);
};

function scheduleDrain() {
  if (state.drainTimer !== null) return;
  state.drainTimer = Timer.set(5, false, function() {
    state.drainTimer = null;
    processQueue();
  });
}

function enqueue(fc, data, cb) {
  state.queue.push({ fc: fc, data: data, cb: cb });
  scheduleDrain();
}

function readRegisters(startAddr, count, callback) {
  var data = [
    (startAddr >> 8) & 0xFF, startAddr & 0xFF,
    (count >> 8) & 0xFF, count & 0xFF
  ];
  enqueue(FC.READ_HOLDING_REGISTERS, data, function(err, response) {
    if (err) {
      callback(err, null);
      return;
    }
    var regs = [];
    for (var i = 1; i < response.length - 1; i += 2) regs.push((response[i] << 8) | response[i + 1]);
    callback(null, regs);
  });
}

function writeRegister(addr, value, callback) {
  var data = [
    (addr >> 8) & 0xFF, addr & 0xFF,
    (value >> 8) & 0xFF, value & 0xFF
  ];
  enqueue(FC.WRITE_SINGLE_REGISTER, data, function(err) { callback(err, !err); });
}

function writeMultipleRegisters(startAddr, values, callback) {
  var i;
  var data = [
    (startAddr >> 8) & 0xFF, startAddr & 0xFF,
    (values.length >> 8) & 0xFF, values.length & 0xFF,
    (values.length * 2) & 0xFF
  ];
  for (i = 0; i < values.length; i++) {
    var v = values[i] & 0xFFFF;
    data.push((v >> 8) & 0xFF);
    data.push(v & 0xFF);
  }
  enqueue(FC.WRITE_MULTIPLE_REGISTERS, data, function(err) { callback(err, !err); });
}

function readCurrentPositions(cb) {
  readRegisters(REG.CURRENT_POS, REG.JOINT_COUNT, function(err, regs) {
    if (err) { cb(err, null); return; }
    cb(null, [
      toSigned(regs[0]),
      toSigned(regs[1]),
      toSigned(regs[2]),
      toSigned(regs[3]),
      toSigned(regs[4]),
      toSigned(regs[5])
    ]);
  });
}

function readBusy(cb) {
  readRegisters(REG.ROBOT_BUSY, 1, function(err, regs) {
    if (err) { cb(err, null); return; }
    cb(null, regs[0] !== 0);
  });
}

function readMotorsEnabled(cb) {
  readRegisters(REG.MOTORS_ENABLED, 1, function(err, regs) {
    if (err) { cb(err, null); return; }
    cb(null, regs[0] !== 0);
  });
}

function setMotorsEnabled(enable, cb) {
  writeRegister(REG.MOTORS_ENABLED, enable ? 1 : 0, cb);
}

function ensureMotorsEnabled(cb) {
  readMotorsEnabled(function(err, enabled) {
    if (err) {
      cb(err);
      return;
    }
    if (enabled) {
      cb(null);
      return;
    }
    setMotorsEnabled(true, function(enErr) {
      cb(enErr || null);
    });
  });
}

function setTargetPositions(targets, cb) {
  if (!targets || targets.length !== 6) {
    cb("Need 6 target values", false);
    return;
  }
  writeMultipleRegisters(REG.TARGET_POS, [
    toUnsigned(targets[0]),
    toUnsigned(targets[1]),
    toUnsigned(targets[2]),
    toUnsigned(targets[3]),
    toUnsigned(targets[4]),
    toUnsigned(targets[5])
  ], cb);
}

function startMotion(cb) {
  writeRegister(REG.START_MOTION, 1, cb);
}

function stopMotion(cb) {
  writeRegister(REG.STOP_MOTION, 1, cb);
}

function moveTo(targets, cb) {
  setTargetPositions(targets, function(err) {
    if (err) { cb(err, false); return; }
    startMotion(cb);
  });
}

function setAllSpeeds(speeds, cb) {
  if (!speeds || speeds.length !== 6) {
    cb("Need 6 speed values", false);
    return;
  }
  writeMultipleRegisters(REG.MAX_SPEED, [
    speeds[0] & 0xFFFF,
    speeds[1] & 0xFFFF,
    speeds[2] & 0xFFFF,
    speeds[3] & 0xFFFF,
    speeds[4] & 0xFFFF,
    speeds[5] & 0xFFFF
  ], cb);
}

function getTargetsFromVC() {
  return [
    getVCValue(VC_J1, 0),
    getVCValue(VC_J2, 0),
    getVCValue(VC_J3, 0),
    getVCValue(VC_J4, 0),
    getVCValue(VC_J5, 0),
    getVCValue(VC_J6, 0)
  ];
}

function getSpeedsFromVC() {
  return [
    getVCValue(VC_S1, 0),
    getVCValue(VC_S2, 0),
    getVCValue(VC_S3, 0),
    getVCValue(VC_S4, 0),
    getVCValue(VC_S5, 0),
    getVCValue(VC_S6, 0)
  ];
}

function refreshStatus() {
  readCurrentPositions(function(err, pos) {
    if (!err && pos) {
      if (posChanged(state.last_pos, pos)) {
        state.last_pos = pos;
        state.last_pos_change_s = state.uptime_s;
        markActivity();
      }
      setVCValue(VC_POS1, pos[0]);
      setVCValue(VC_POS2, pos[1]);
      setVCValue(VC_POS3, pos[2]);
      setVCValue(VC_POS4, pos[3]);
      setVCValue(VC_POS5, pos[4]);
      setVCValue(VC_POS6, pos[5]);
    }
  });

  readBusy(function(err, busy) {
    if (!err) {
      state.robotBusy = busy;
      setVCValue(VC_BUSY, busy);
    }
  });

  readMotorsEnabled(function(err, enabled) {
    if (!err) {
      state.motorsEnabled = enabled;
      setVCValue(VC_MOTORS, enabled);
    }
  });
}

function maybeAutoDisableMotors() {
  if (!CONFIG.AUTO_DISABLE_MOTORS) return;
  if (state.motorsEnabled !== true) return;
  if (state.pendingRequest || (state.queue && state.queue.length > 0)) return;

  // Consider "moving" if positions have changed recently. This works even if RobotBusy is unreliable.
  var movingRecently = (state.uptime_s - state.last_pos_change_s) <= CONFIG.MOVING_GRACE_S;
  if (state.robotBusy === true && movingRecently) return;
  if (movingRecently) return;

  var idleFor = state.uptime_s - state.last_activity_s;
  if (idleFor < CONFIG.IDLE_OFF_DELAY_S) return;

  setMotorsEnabled(false, function(err) {
    if (err) {
      print("[IDLE] Auto-disable failed: " + err);
      return;
    }
    state.motorsEnabled = false;
    setVCValue(VC_MOTORS, false);
    print("[IDLE] Drives disabled after " + idleFor + "s idle");
  });
}

function getVCValue(handle, fallback) {
  if (!handle || !handle.getValue) return fallback;
  var v = handle.getValue();
  if (v === null || v === undefined) return fallback;
  return v;
}

function setVCValue(handle, value) {
  if (!handle || !handle.setValue) return;
  handle.setValue(value);
}

function bindButton(handle, label, fn) {
  if (!handle || !handle.on) {
    print("[VC] Missing " + label);
    return;
  }
  handle.on("single_push", fn);
}

function bindVCHandlers() {
  bindButton(VC_BTN_ENABLE, "button:300", function() {
    markActivity();
    setMotorsEnabled(true, function(err) {
      if (err) print("[VC] Enable failed: " + err);
      else state.motorsEnabled = true;
      refreshStatus();
    });
  });

  bindButton(VC_BTN_DISABLE, "button:301", function() {
    markActivity();
    setMotorsEnabled(false, function(err) {
      if (err) print("[VC] Disable failed: " + err);
      else state.motorsEnabled = false;
      refreshStatus();
    });
  });

  bindButton(VC_BTN_MOVE, "button:302|200", function() {
    markActivity();
    print("[VC] GO pressed; targets=" + JSON.stringify(getTargetsFromVC()));
    ensureMotorsEnabled(function(enErr) {
      if (enErr) {
        print("[VC] Enable before move failed: " + enErr);
        refreshStatus();
        return;
      }
      moveTo(getTargetsFromVC(), function(err) {
        if (err) print("[VC] Move failed: " + err);
        else print("[VC] Move command sent");
        refreshStatus();
      });
    });
  });

  bindButton(VC_BTN_CLEAR, "button:307|201", function() {
    markActivity();
    setVCValue(VC_J1, 0);
    setVCValue(VC_J2, 0);
    setVCValue(VC_J3, 0);
    setVCValue(VC_J4, 0);
    setVCValue(VC_J5, 0);
    setVCValue(VC_J6, 0);
    print("[VC] CLEAR pressed; sliders set to 0");
  });

  bindButton(VC_BTN_HOME, "button:304", function() {
    markActivity();
    ensureMotorsEnabled(function(enErr) {
      if (enErr) {
        print("[VC] Enable before home failed: " + enErr);
        refreshStatus();
        return;
      }
      moveTo([0, 0, 0, 0, 0, 0], function(err) {
        if (err) print("[VC] Home failed: " + err);
        refreshStatus();
      });
    });
  });

  bindButton(VC_BTN_STOP, "button:303", function() {
    markActivity();
    stopMotion(function(err) {
      if (err) print("[VC] Stop failed: " + err);
      refreshStatus();
    });
  });

  bindButton(VC_BTN_WRITE_SPEEDS, "button:306", function() {
    markActivity();
    ensureMotorsEnabled(function(enErr) {
      if (enErr) {
        print("[VC] Enable before write speeds failed: " + enErr);
        refreshStatus();
        return;
      }
      setAllSpeeds(getSpeedsFromVC(), function(err) {
        if (err) print("[VC] Write speeds failed: " + err);
        refreshStatus();
      });
    });
  });

  bindButton(VC_BTN_READ, "button:305", function() {
    markActivity();
    refreshStatus();
  });
}

function init() {
  state.uart = UART.get();
  if (!state.uart) {
    print("UART unavailable");
    return;
  }
  if (!state.uart.configure({ baud: CONFIG.BAUD_RATE, mode: CONFIG.MODE })) {
    print("UART configure failed");
    return;
  }

  state.uart.recv(onReceive);
  state.isReady = true;

  bindVCHandlers();
  state.uptime_s = 0;
  state.last_activity_s = 0;
  state.last_pos = null;
  state.last_pos_change_s = 0;
  if (state.idleTimer) Timer.clear(state.idleTimer);
  state.idleTimer = Timer.set(1000, true, function() {
    state.uptime_s++;
    maybeAutoDisableMotors();
  });

  if (CONFIG.AUTO_ENABLE_MOTORS) {
    Timer.set(800, false, function() {
      markActivity();
      setMotorsEnabled(true, function(err) {
        if (err) {
          print("[INIT] Auto enable failed: " + err);
        } else {
          print("[INIT] Drives enabled");
          state.motorsEnabled = true;
        }
        refreshStatus();
      });
    });
  }
  Timer.set(500, false, refreshStatus);
  state.pollTimer = Timer.set(CONFIG.POLL_INTERVAL, true, refreshStatus);

  print("Robko01 VC+MODBUS ready");
}

init();
