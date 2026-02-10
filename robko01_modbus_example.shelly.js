/**
 * @title Robko01 MODBUS-RTU controller
 * @description Controls Robko01 robot arm over MODBUS-RTU via Shelly The Pill.
 * @status under development
 */

/**
 * Robko01 Robot Arm MODBUS-RTU Controller for Shelly
 *
 * Controls a Robko01 6-axis robot arm via MODBUS-RTU protocol.
 * Based on the Robko01 retrofit firmware register map.
 *
 * Register Map (Holding Registers, FC 03/06/10):
 *   0-5   CurrentPos J1-J6  (Read)   Current joint positions in steps
 *   6-11  TargetPos  J1-J6  (R/W)    Target joint positions in steps
 *   12    MotorsEnabled      (R/W)    0=disabled, 1=enabled
 *   13    RobotBusy          (Read)   0=idle, 1=moving
 *   14-19 MaxSpeed   J1-J6  (R/W)    Max speed in steps/sec
 *   20    StartMotion        (Write)  Write 1 to start motion
 *   21    StopMotion         (Write)  Write 1 to stop motion
 *
 * Hardware connection:
 *   RS485 Module A (D+) -> Robko01 A (D+)
 *   RS485 Module B (D-) -> Robko01 B (D-)
 *
 * Default: 9600 baud, 8N1, Slave ID 1
 */

/* === CONFIG === */
var CONFIG = {
    BAUD_RATE: 9600,
    MODE: "8N1",
    SLAVE_ID: 1,
    RESPONSE_TIMEOUT: 2000,
    POLL_INTERVAL: 2000,
    DEBUG: true
};

/* === ROBKO01 REGISTER MAP === */
var REG = {
    CURRENT_POS: 0,    // 0-5:  CurrentPos J1-J6 (read)
    TARGET_POS: 6,     // 6-11: TargetPos J1-J6 (r/w)
    MOTORS_ENABLED: 12,// 12:   MotorsEnabled (r/w)
    ROBOT_BUSY: 13,    // 13:   RobotBusy (read)
    MAX_SPEED: 14,     // 14-19: MaxSpeed J1-J6 (r/w)
    START_MOTION: 20,  // 20:   StartMotion (write 1)
    STOP_MOTION: 21,   // 21:   StopMotion (write 1)
    JOINT_COUNT: 6
};

/* === MODBUS FUNCTION CODES === */
var FC = {
    READ_HOLDING_REGISTERS: 0x03,
    WRITE_SINGLE_REGISTER: 0x06,
    WRITE_MULTIPLE_REGISTERS: 0x10
};

/* === CRC-16 TABLE (MODBUS polynomial 0xA001) === */
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
    pollTimer: null,
    motorsEnabled: false,
    robotBusy: false,
    currentPos: [0, 0, 0, 0, 0, 0],
    queue: [],
    drainTimer: null
};

/* === HELPERS === */

function toHex(n) {
    n = n & 0xFF;
    return (n < 16 ? "0" : "") + n.toString(16).toUpperCase();
}

function bytesToHex(bytes) {
    var hex = "";
    for (var i = 0; i < bytes.length; i++) {
        hex += toHex(bytes[i]);
        if (i < bytes.length - 1) hex += " ";
    }
    return hex;
}

function debug(msg) {
    if (CONFIG.DEBUG) {
        print("[ROBKO] " + msg);
    }
}

function calcCRC(bytes) {
    var crc = 0xFFFF;
    for (var i = 0; i < bytes.length; i++) {
        var index = (crc ^ bytes[i]) & 0xFF;
        crc = (crc >> 8) ^ CRC_TABLE[index];
    }
    return crc;
}

function bytesToStr(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) {
        s += String.fromCharCode(bytes[i] & 0xFF);
    }
    return s;
}

function toSigned(value) {
    return value > 32767 ? value - 65536 : value;
}

function toUnsigned(value) {
    return value & 0xFFFF;
}

function buildFrame(slaveAddr, functionCode, data) {
    var frame = [slaveAddr & 0xFF, functionCode & 0xFF];
    if (data) {
        for (var i = 0; i < data.length; i++) {
            frame.push(data[i] & 0xFF);
        }
    }
    var crc = calcCRC(frame);
    frame.push(crc & 0xFF);
    frame.push((crc >> 8) & 0xFF);
    return frame;
}

/* === MODBUS CORE === */

function clearRespTimeout() {
    if (state.responseTimer) {
        Timer.clear(state.responseTimer);
        state.responseTimer = null;
    }
}

function getExpectedLength(fc) {
    switch (fc) {
        case FC.READ_HOLDING_REGISTERS:
            if (state.rxBuffer.length >= 3) {
                return 3 + state.rxBuffer[2] + 2;
            }
            return 0;
        case FC.WRITE_SINGLE_REGISTER:
        case FC.WRITE_MULTIPLE_REGISTERS:
            return 8;
        default:
            return 0;
    }
}

var processQueue; // forward declaration

function sendRequest(functionCode, data, callback) {
    if (!state.isReady) {
        callback("Not initialized", null);
        return;
    }
    if (state.pendingRequest) {
        callback("Request pending", null);
        return;
    }

    var frame = buildFrame(CONFIG.SLAVE_ID, functionCode, data);
    debug("TX: " + bytesToHex(frame));

    state.pendingRequest = {
        functionCode: functionCode,
        callback: callback
    };
    state.rxBuffer = [];

    state.responseTimer = Timer.set(CONFIG.RESPONSE_TIMEOUT, false, function() {
        if (state.pendingRequest) {
            var cb = state.pendingRequest.callback;
            state.pendingRequest = null;
            debug("Timeout");
            Timer.set(1, false, function() {
                cb("Timeout", null);
                scheduleDrain();
            });
        }
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

    // Exception response
    if (fc & 0x80) {
        if (state.rxBuffer.length >= 5) {
            var excFrame = state.rxBuffer.slice(0, 5);
            var crc = calcCRC(excFrame.slice(0, 3));
            var recvCrc = excFrame[3] | (excFrame[4] << 8);
            if (crc === recvCrc) {
                clearRespTimeout();
                var exCode = state.rxBuffer[2];
                var cb = state.pendingRequest.callback;
                state.pendingRequest = null;
                state.rxBuffer = [];
                var exMsg = "Exception: 0x" + toHex(exCode);
                debug(exMsg);
                Timer.set(1, false, function() {
                    cb(exMsg, null);
                    scheduleDrain();
                });
            }
        }
        return;
    }

    var expectedLen = getExpectedLength(fc);
    if (expectedLen === 0 || state.rxBuffer.length < expectedLen) return;

    var frame = state.rxBuffer.slice(0, expectedLen);
    var crc = calcCRC(frame.slice(0, expectedLen - 2));
    var recvCrc = frame[expectedLen - 2] | (frame[expectedLen - 1] << 8);

    if (crc !== recvCrc) {
        debug("CRC error");
        return;
    }

    debug("RX: " + bytesToHex(frame));
    clearRespTimeout();

    var responseData = frame.slice(2, expectedLen - 2);
    var cb = state.pendingRequest.callback;
    state.pendingRequest = null;
    state.rxBuffer = [];
    // Defer callback to unwind stack (mJS has ~1KB stack)
    Timer.set(1, false, function() {
        cb(null, responseData);
        scheduleDrain();
    });
}

function onReceive(data) {
    if (!data || data.length === 0) return;
    for (var i = 0; i < data.length; i++) {
        state.rxBuffer.push(data.charCodeAt(i) & 0xFF);
    }
    processResponse();
}

/* === REQUEST QUEUE === */

processQueue = function() {
    if (state.pendingRequest || state.queue.length === 0) return;
    var req = state.queue.splice(0, 1)[0];
    sendRequest(req.functionCode, req.data, req.callback);
};

// Schedule queue drain via a single reusable timer (avoids timer flood)
function scheduleDrain() {
    if (state.drainTimer !== null) return;
    state.drainTimer = Timer.set(5, false, function() {
        state.drainTimer = null;
        processQueue();
    });
}

function enqueue(functionCode, data, callback) {
    state.queue.push({
        functionCode: functionCode,
        data: data,
        callback: callback
    });
    scheduleDrain();
}

/* === ROBKO01 API === */

/**
 * Read holding registers
 * @param {number} startAddr - Starting register address
 * @param {number} count - Number of registers to read
 * @param {function} callback - callback(error, registers[])
 */
function readRegisters(startAddr, count, callback) {
    var data = [
        (startAddr >> 8) & 0xFF, startAddr & 0xFF,
        (count >> 8) & 0xFF, count & 0xFF
    ];
    enqueue(FC.READ_HOLDING_REGISTERS, data, function(err, response) {
        if (err) { callback(err, null); return; }
        var registers = [];
        for (var i = 1; i < response.length - 1; i += 2) {
            registers.push((response[i] << 8) | response[i + 1]);
        }
        callback(null, registers);
    });
}

/**
 * Write a single holding register (FC 0x06)
 * @param {number} addr - Register address
 * @param {number} value - Value to write (0-65535)
 * @param {function} callback - callback(error, success)
 */
function writeRegister(addr, value, callback) {
    var data = [
        (addr >> 8) & 0xFF, addr & 0xFF,
        (value >> 8) & 0xFF, value & 0xFF
    ];
    enqueue(FC.WRITE_SINGLE_REGISTER, data, function(err) {
        callback(err, !err);
    });
}

/**
 * Write multiple holding registers (FC 0x10)
 * @param {number} startAddr - Starting register address
 * @param {Array} values - Array of 16-bit values
 * @param {function} callback - callback(error, success)
 */
function writeMultipleRegisters(startAddr, values, callback) {
    var byteCount = values.length * 2;
    var data = [
        (startAddr >> 8) & 0xFF, startAddr & 0xFF,
        (values.length >> 8) & 0xFF, values.length & 0xFF,
        byteCount & 0xFF
    ];
    for (var i = 0; i < values.length; i++) {
        var v = values[i] & 0xFFFF;
        data.push((v >> 8) & 0xFF);
        data.push(v & 0xFF);
    }
    enqueue(FC.WRITE_MULTIPLE_REGISTERS, data, function(err) {
        callback(err, !err);
    });
}

/* === HIGH-LEVEL ROBOT FUNCTIONS === */

/**
 * Read current joint positions (registers 0-5)
 * @param {function} callback - callback(error, positions[6]) signed steps
 */
function readCurrentPositions(callback) {
    readRegisters(REG.CURRENT_POS, REG.JOINT_COUNT, function(err, regs) {
        if (err) { callback(err, null); return; }
        var pos = [];
        for (var i = 0; i < regs.length; i++) {
            pos.push(toSigned(regs[i]));
        }
        state.currentPos = pos;
        callback(null, pos);
    });
}

/**
 * Read robot busy status (register 13)
 * @param {function} callback - callback(error, busy)
 */
function readBusy(callback) {
    readRegisters(REG.ROBOT_BUSY, 1, function(err, regs) {
        if (err) { callback(err, null); return; }
        var busy = regs[0] !== 0;
        state.robotBusy = busy;
        callback(null, busy);
    });
}

/**
 * Read motors enabled status (register 12)
 * @param {function} callback - callback(error, enabled)
 */
function readMotorsEnabled(callback) {
    readRegisters(REG.MOTORS_ENABLED, 1, function(err, regs) {
        if (err) { callback(err, null); return; }
        var enabled = regs[0] !== 0;
        state.motorsEnabled = enabled;
        callback(null, enabled);
    });
}

/**
 * Enable or disable motors (register 12)
 * @param {boolean} enable - true to enable, false to disable
 * @param {function} callback - callback(error, success)
 */
function setMotorsEnabled(enable, callback) {
    writeRegister(REG.MOTORS_ENABLED, enable ? 1 : 0, function(err, ok) {
        if (!err) state.motorsEnabled = enable;
        callback(err, ok);
    });
}

/**
 * Set target positions for all 6 joints (registers 6-11)
 * @param {Array} targets - Array of 6 signed step values
 * @param {function} callback - callback(error, success)
 */
function setTargetPositions(targets, callback) {
    if (targets.length !== REG.JOINT_COUNT) {
        callback("Expected " + REG.JOINT_COUNT + " targets", false);
        return;
    }
    var unsigned = [];
    for (var i = 0; i < targets.length; i++) {
        unsigned.push(toUnsigned(targets[i]));
    }
    writeMultipleRegisters(REG.TARGET_POS, unsigned, callback);
}

/**
 * Start interpolated motion (register 20)
 * @param {function} callback - callback(error, success)
 */
function startMotion(callback) {
    writeRegister(REG.START_MOTION, 1, callback);
}

/**
 * Stop all motion immediately (register 21)
 * @param {function} callback - callback(error, success)
 */
function stopMotion(callback) {
    writeRegister(REG.STOP_MOTION, 1, callback);
}

/**
 * Move robot to target positions: set targets then start motion
 * @param {Array} targets - Array of 6 signed step values
 * @param {function} callback - callback(error, success)
 */
function moveTo(targets, callback) {
    setTargetPositions(targets, function(err) {
        if (err) { callback(err, false); return; }
        startMotion(callback);
    });
}

/**
 * Read max speed settings for all 6 joints (registers 14-19)
 * @param {function} callback - callback(error, speeds[6])
 */
function readMaxSpeeds(callback) {
    readRegisters(REG.MAX_SPEED, REG.JOINT_COUNT, callback);
}

/**
 * Set max speed for a single joint (registers 14-19)
 * @param {number} joint - Joint index 0-5
 * @param {number} speed - Speed in steps/sec
 * @param {function} callback - callback(error, success)
 */
function setMaxSpeed(joint, speed, callback) {
    if (joint < 0 || joint >= REG.JOINT_COUNT) {
        callback("Invalid joint: " + joint, false);
        return;
    }
    writeRegister(REG.MAX_SPEED + joint, speed & 0xFFFF, callback);
}

/* ======================================================
 * PROGRAM SEQUENCER
 * ======================================================
 *
 * Write robot programs as a simple list of steps.
 * Each step is an array: [action, ...params]
 *
 * Available actions:
 *   ["enable"]                          - Turn motors ON
 *   ["disable"]                         - Turn motors OFF
 *   ["move", J1, J2, J3, J4, J5, J6]   - Move to position (steps)
 *   ["wait"]                            - Wait until motion is complete
 *   ["delay", ms]                       - Pause for N milliseconds
 *   ["home"]                            - Move to [0,0,0,0,0,0]
 *   ["speed", joint, value]             - Set max speed for a joint
 *   ["stop"]                            - Emergency stop
 *   ["print", "message"]               - Print a message
 *   ["loop", count]                     - Repeat from start N times (0=forever)
 *
 * Joint names:
 *   J1=Base  J2=Shoulder  J3=Elbow  J4=WristPitch  J5=WristRoll  J6=Gripper
 *
 * ---- EXAMPLE PROGRAM ----
 *
 *  var pickAndPlace = [
 *  //  Action    J1    J2    J3    J4    J5    J6
 *      ["print", "Pick and place demo"],
 *      ["enable"],
 *      ["move",  200,  150,  100,    0,    0,    0],
 *      ["wait"],
 *      ["move",  200,  150,  100,    0,    0,   50],  // close gripper
 *      ["wait"],
 *      ["delay", 300],
 *      ["move",    0,    0,   50,    0,    0,   50],  // lift up
 *      ["wait"],
 *      ["move", -200,  150,  100,    0,    0,   50],  // move to place
 *      ["wait"],
 *      ["move", -200,  150,  100,    0,    0,    0],  // open gripper
 *      ["wait"],
 *      ["home"],
 *      ["wait"],
 *      ["disable"],
 *      ["print", "Done!"]
 *  ];
 *
 *  runProgram(pickAndPlace);
 *
 * ==================================================== */

var prog = {
    steps: [],
    index: 0,
    running: false,
    loopsLeft: -1,
    callback: null
};

function stopProgram() {
    prog.running = false;
    prog.index = 0;
    print("[PRG] Program stopped");
    // Resume polling
    if (!state.pollTimer) {
        state.pollTimer = Timer.set(CONFIG.POLL_INTERVAL, true, pollStatus);
    }
}

// Forward declare for mutual recursion between runNextStep <-> waitUntilDone
var runNextStep;
var waitUntilDone;

waitUntilDone = function() {
    readBusy(function(err, busy) {
        if (err) {
            print("[PRG] Busy read error: " + err + ", retrying...");
            Timer.set(500, false, waitUntilDone);
            return;
        }
        if (busy) {
            Timer.set(100, false, waitUntilDone);
        } else {
            runNextStep();
        }
    });
};

runNextStep = function() {
    if (!prog.running) return;

    if (prog.index >= prog.steps.length) {
        prog.running = false;
        print("[PRG] Program finished");
        if (prog.callback) prog.callback();
        return;
    }

    var step = prog.steps[prog.index];
    var action = step[0];
    prog.index++;

    print("[PRG] Step " + prog.index + "/" + prog.steps.length + ": " + JSON.stringify(step));

    if (action === "enable") {
        setMotorsEnabled(true, function(err) {
            if (err) { print("[PRG] ERROR: " + err); stopProgram(); return; }
            runNextStep();
        });

    } else if (action === "disable") {
        setMotorsEnabled(false, function(err) {
            if (err) { print("[PRG] ERROR: " + err); stopProgram(); return; }
            runNextStep();
        });

    } else if (action === "move") {
        var targets = [step[1], step[2], step[3], step[4], step[5], step[6]];
        moveTo(targets, function(err) {
            if (err) { print("[PRG] ERROR: " + err); stopProgram(); return; }
            runNextStep();
        });

    } else if (action === "home") {
        moveTo([0, 0, 0, 0, 0, 0], function(err) {
            if (err) { print("[PRG] ERROR: " + err); stopProgram(); return; }
            runNextStep();
        });

    } else if (action === "wait") {
        waitUntilDone();

    } else if (action === "delay") {
        var ms = step[1] || 1000;
        Timer.set(ms, false, function() {
            runNextStep();
        });

    } else if (action === "speed") {
        setMaxSpeed(step[1], step[2], function(err) {
            if (err) { print("[PRG] ERROR: " + err); stopProgram(); return; }
            runNextStep();
        });

    } else if (action === "stop") {
        stopMotion(function(err) {
            if (err) { print("[PRG] ERROR: " + err); }
            runNextStep();
        });

    } else if (action === "print") {
        print("[PRG] " + step[1]);
        Timer.set(1, false, runNextStep);

    } else if (action === "loop") {
        var count = step[1] || 0;
        if (prog.loopsLeft === -1) {
            prog.loopsLeft = count === 0 ? 999999 : count;
        }
        if (prog.loopsLeft > 0) {
            prog.loopsLeft--;
            prog.index = 0;
            print("[PRG] Loop restart (" + (prog.loopsLeft) + " remaining)");
            Timer.set(1, false, runNextStep);
        } else {
            prog.loopsLeft = -1;
            Timer.set(1, false, runNextStep);
        }

    } else {
        print("[PRG] Unknown action: " + action);
        Timer.set(1, false, runNextStep);
    }
};

function runProgram(steps, callback) {
    if (prog.running) {
        print("[PRG] Already running! Use stopProgram() first.");
        return;
    }
    // Pause polling while program runs to avoid queue contention
    if (state.pollTimer) {
        Timer.clear(state.pollTimer);
        state.pollTimer = null;
    }
    prog.steps = steps;
    prog.index = 0;
    prog.running = true;
    prog.loopsLeft = -1;
    prog.callback = function() {
        // Resume polling after program finishes
        print("[PRG] Resuming status polling");
        state.pollTimer = Timer.set(CONFIG.POLL_INTERVAL, true, pollStatus);
        if (callback) callback();
    };
    print("[PRG] Starting program (" + steps.length + " steps)");
    runNextStep();
}

/* === STATUS POLLING === */

function pollStatus() {
    debug("--- Polling Robko01 ---");

    readCurrentPositions(function(err, pos) {
        if (err) {
            debug("Position read error: " + err);
            return;
        }
        print("[POS] J1:" + pos[0] + " J2:" + pos[1] + " J3:" + pos[2] +
              " J4:" + pos[3] + " J5:" + pos[4] + " J6:" + pos[5]);

        readBusy(function(err, busy) {
            if (err) {
                debug("Busy read error: " + err);
                return;
            }
            readMotorsEnabled(function(err, enabled) {
                if (err) {
                    debug("Motors read error: " + err);
                    return;
                }
                print("[STS] Motors:" + (enabled ? "ON" : "OFF") +
                      " Busy:" + (busy ? "YES" : "NO"));
            });
        });
    });
}

/* === INITIALIZATION === */

function init() {
    print("Robko01 MODBUS-RTU Controller");
    print("=============================");
    print("6-axis robot arm control via The Pill");
    print("");

    state.uart = UART.get();
    if (!state.uart) {
        print("ERROR: UART not available");
        return;
    }

    if (!state.uart.configure({
        baud: CONFIG.BAUD_RATE,
        mode: CONFIG.MODE
    })) {
        print("ERROR: UART configuration failed");
        return;
    }

    state.uart.recv(onReceive);
    state.isReady = true;

    debug("UART: " + CONFIG.BAUD_RATE + " baud, " + CONFIG.MODE);
    debug("Slave ID: " + CONFIG.SLAVE_ID);
    print("");

    print("Starting status polling every " + (CONFIG.POLL_INTERVAL / 1000) + "s...");
    print("");

    // Initial poll after 500ms settle time
    Timer.set(500, false, pollStatus);

    // Periodic polling
    state.pollTimer = Timer.set(CONFIG.POLL_INTERVAL, true, pollStatus);

    print("API Functions:");
    print("  readCurrentPositions(cb)     - Read J1-J6 positions");
    print("  readBusy(cb)                 - Check if robot is moving");
    print("  readMotorsEnabled(cb)        - Check motor state");
    print("  setMotorsEnabled(bool, cb)   - Enable/disable motors");
    print("  setTargetPositions([6], cb)  - Set target for all joints");
    print("  startMotion(cb)              - Trigger motion");
    print("  stopMotion(cb)               - Emergency stop");
    print("  moveTo([6], cb)              - Set targets + start motion");
    print("  readMaxSpeeds(cb)            - Read speed limits");
    print("  setMaxSpeed(joint, spd, cb)  - Set joint speed limit");
    print("");
    print("Example: Enable motors and move J1 to 100 steps");
    print("  setMotorsEnabled(true, function(e,s) {");
    print("    moveTo([100,0,0,0,0,0], function(e,s) { print(s); });");
    print("  });");
}

init();
