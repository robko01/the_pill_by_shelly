// Created with the help of Ivanushka (ChatGPT)
//
// Shelly Script: Virtual UI Auto-Setup for Robko01
// - Creates ALL needed virtual “graphical components” (numbers + buttons)
// - Creates TWO virtual Groups and puts everything inside them
//
// Fix in this version:
// - Force ui.view for numbers/buttons so they are NOT Hidden (so they appear in the UI)

/*** CONFIG ***/
let WIPE_EXISTING_VIRTUALS = true;   // set false if you don’t want deletions
let GROUP_ID_EXPECTED = 200;         // we expect group:200 after wipe+create (best-effort)

/*** Desired components (order matters for stable IDs after wipe) ***/
let DESIRED = [
  // Numbers (expect: number:200..205)
  { type: "number", name: "Base (steps)" },
  { type: "number", name: "Shoulder (steps)" },
  { type: "number", name: "Elbow (steps)" },
  { type: "number", name: "P (steps)" },
  { type: "number", name: "R (steps)" },
  { type: "number", name: "Gripper (steps)" },

  // Buttons (expect: button:200..201)
  { type: "button", name: "GO" },
  { type: "button", name: "CLEAR" },

  // Groups (expect: group:200..201)
  { type: "group", name: "Jog" },
  { type: "group", name: "Actions" },
];

/*** Helpers ***/
function rpc(method, params, cb) {
  Shelly.call(method, params || {}, function (res, err, msg) {
    if (err) {
      print("RPC error:", method, "err=", err, "msg=", msg);
      cb && cb(null, { err: err, msg: msg });
      return;
    }
    cb && cb(res, null);
  });
}

function nextTick(fn, delay_ms) {
  Timer.set(delay_ms || 50, false, fn);
}

function startsWith(s, p) { return s && s.indexOf(p) === 0; }

/*** Step 1: list existing components ***/
function getAllComponents(cb) {
  rpc("Shelly.GetComponents", {}, function (res, e) {
    if (e) return cb([]);
    let arr = (res && res.components) ? res.components : [];
    cb(arr);
  });
}

function isVirtualKey(k) {
  return (
    startsWith(k, "number:") ||
    startsWith(k, "button:") ||
    startsWith(k, "group:")  ||
    startsWith(k, "text:")   ||
    startsWith(k, "boolean:")||
    startsWith(k, "enum:")
  );
}

/*** Step 2: optionally wipe existing virtual components (to guarantee IDs) ***/
function wipeVirtuals(components, done) {
  if (!WIPE_EXISTING_VIRTUALS) return done();

  let keys = [];
  for (let i = 0; i < components.length; i++) {
    let c = components[i];
    if (c && c.key && isVirtualKey(c.key)) keys.push(c.key);
  }

  if (keys.length === 0) return done();

  print("Wiping virtual components:", JSON.stringify(keys));

  let idx = 0;
  function delNext() {
    if (idx >= keys.length) return done();
    let key = keys[idx++];
    rpc("Virtual.Delete", { key: key }, function () {
      nextTick(delNext, 80);
    });
  }
  delNext();
}

/*** UI configs to make components VISIBLE (not Hidden) ***/
function desiredConfig(d) {
  if (d.type === "number") {
    // Number ui.view supports: field, slider, progressbar, label... :contentReference[oaicite:2]{index=2}
    return { name: d.name, ui: { view: "field", unit: "steps", step: 1 } };
  }
  if (d.type === "button") {
    // Button view options include Button vs Hidden in Shelly UI docs. :contentReference[oaicite:3]{index=3}
    return { name: d.name, ui: { view: "button" } };
  }
  if (d.type === "group") {
    return { name: d.name };
  }
  return { name: d.name };
}

function forceVisibleConfig(type, id, name, cb) {
  // Some firmwares accept ui fields on Virtual.Add, some don’t.
  // So we ALSO call <Type>.SetConfig after creation.
  if (type === "number") {
    rpc("Number.SetConfig", {
      id: id,
      config: { name: name, ui: { view: "field", unit: "steps", step: 1 } }
    }, function () { cb && cb(); });
    return;
  }

  if (type === "button") {
    // If Button.SetConfig is not supported on your device/firmware, this will error,
    // but we ignore it (component will still exist).
    rpc("Button.SetConfig", {
      id: id,
      config: { name: name, ui: { view: "button" } }
    }, function () { cb && cb(); });
    return;
  }

  cb && cb();
}

/*** Step 3: create desired components in order ***/
let createdKeys = [];

function createDesired(done) {
  let i = 0;

  function addNext() {
    if (i >= DESIRED.length) return done();

    let d = DESIRED[i++];
    let cfg = desiredConfig(d);

    rpc("Virtual.Add", { type: d.type, config: cfg }, function (res, e) {
      if (!e && res && typeof res.id === "number") {
        let key = d.type + ":" + res.id;
        createdKeys.push(key);
        print("Created:", key, "name=", d.name);

        // Force UI visibility (not Hidden)
        forceVisibleConfig(d.type, res.id, d.name, function () {
          nextTick(addNext, 120);
        });
      } else {
        print("Failed creating type=", d.type, "name=", d.name);
        nextTick(addNext, 120);
      }
    });
  }

  addNext();
}

/*** Step 4: set group contents (multiple groups) ***/
function setupGroup(done) {
  let jogGroup = null;
  let actionsGroup = null;

  let numbers = [];
  let buttons = [];

  for (let i = 0; i < createdKeys.length; i++) {
    let k = createdKeys[i];

    if (startsWith(k, "group:")) {
      if (!jogGroup) jogGroup = k;
      else actionsGroup = k;
    } else if (startsWith(k, "number:")) {
      numbers.push(k);
    } else if (startsWith(k, "button:")) {
      buttons.push(k);
    }
  }

  function setGroup(groupKey, members, cb) {
    if (!groupKey) return cb();
    let gid = parseInt(groupKey.split(":")[1]);
    print("Setting group", groupKey, "members:", JSON.stringify(members));
    rpc("Group.Set", { id: gid, value: members }, cb);
  }

  setGroup(jogGroup, numbers, function () {
    setGroup(actionsGroup, buttons, function () {
      done();
    });
  });
}

/*** Step 5: initialize number values to 0 ***/
function initNumbersToZero(done) {
  let nums = [];
  for (let i = 0; i < createdKeys.length; i++) {
    if (startsWith(createdKeys[i], "number:")) nums.push(createdKeys[i]);
  }

  let idx = 0;
  function setNext() {
    if (idx >= nums.length) return done();

    let key = nums[idx++];
    let id = parseInt(key.split(":")[1]);

    rpc("Number.Set", { id: id, value: 0 }, function () {
      nextTick(setNext, 60);
    });
  }
  setNext();
}

/*** Main ***/
function run() {
  print("=== Robko01 Virtual UI Auto-Setup starting ===");
  getAllComponents(function (components) {
    wipeVirtuals(components, function () {
      createDesired(function () {
        setupGroup(function () {
          initNumbersToZero(function () {
            print("✅ Done. You should now see groups: Jog, Actions");
            print("Created keys:", JSON.stringify(createdKeys));
          });
        });
      });
    });
  });
}

run();
