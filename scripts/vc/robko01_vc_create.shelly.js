// Created with the help of Ivanushka (ChatGPT)
//
// Shelly Script: Virtual UI Auto-Setup for Robko01
// - Virtual Components & Groups are fully declared in DESIRED
// - Group membership/relations are declared in DESIRED.groups
// - Script creates components, forces UI visibility, then populates groups

/*** CONFIG ***/
let WIPE_EXISTING_VIRTUALS = true;  // set false if you don’t want deletions

/*** DESIRED: all Virtual-component-related stuff exported here ***/
let DESIRED = {
  // 1) Components: define everything, including ui config
  components: [
    // Numbers
    { alias: "j_base",     type: "number", name: "Base (steps)",     ui: { view: "slider", unit: "steps", step: 1 }, min: -500, max: 500, default_value: 0, },
    { alias: "j_shoulder", type: "number", name: "Shoulder (steps)", ui: { view: "slider", unit: "steps", step: 1 }, min: -500, max: 500, default_value: 0, },
    { alias: "j_elbow",    type: "number", name: "Elbow (steps)",    ui: { view: "slider", unit: "steps", step: 1 }, min: -500, max: 500, default_value: 0, },
    { alias: "j_p",        type: "number", name: "P (steps)",        ui: { view: "slider", unit: "steps", step: 1 }, min: -500, max: 500, default_value: 0, },
    { alias: "j_r",        type: "number", name: "R (steps)",        ui: { view: "slider", unit: "steps", step: 1 }, min: -500, max: 500, default_value: 0, },
    { alias: "j_grip",     type: "number", name: "Gripper (steps)",  ui: { view: "slider", unit: "steps", step: 1 }, min: -500, max: 500, default_value: 0, },

    // Buttons
    { alias: "btn_go",     type: "button", name: "GO",    ui: { view: "button" } },
    { alias: "btn_clear",  type: "button", name: "CLEAR", ui: { view: "button" } },

    // Groups (declared as components too, so creation is uniform)
    { alias: "grp_jog",     type: "group", name: "Jog" },
    { alias: "grp_actions", type: "group", name: "Actions" },
  ],

  // 2) Relations: define which aliases go into which group alias
  groups: [
    { group: "grp_jog", members: ["j_base", "j_shoulder", "j_elbow", "j_p", "j_r", "j_grip"] },
    { group: "grp_actions", members: ["btn_go", "btn_clear"] },
  ],

  // 3) Post-create defaults (optional)
  defaults: {
    numbers_to_zero: true,
  }
};

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

/*** Step 1: list existing components ***/
function getAllComponents(cb) {
  rpc("Shelly.GetComponents", {}, function (res, e) {
    if (e) return cb([]);
    let arr = (res && res.components) ? res.components : [];
    cb(arr);
  });
}

/*** Step 2: optionally wipe existing virtual components ***/
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

/*** Config building ***/
function buildVirtualAddConfig(item) {
  // Virtual.Add expects {type, config:{...}}
  // We keep config minimal but include ui when provided.
  let cfg = { name: item.name, meta: {} };
  if (item.ui) cfg.meta.ui = item.ui;
  if (item.min) cfg.min = item.min;
  if (item.max) cfg.max = item.max;
  if (item.default_value) cfg.default_value = item.default_value;
  return cfg;
}

function forceConfig(item, newId, cb) {
  // After creation, force config with SetConfig (to ensure ui is applied even if Virtual.Add ignores it)
  // Use the SAME config fields as desired (including min/max for sliders).
  let cfg = { name: item.name };
  if (item.ui) cfg.ui = item.ui;

  if (item.type === "number") {
    rpc("Number.SetConfig", { id: newId, config: cfg }, function () { cb && cb(); });
    return;
  }
  if (item.type === "button") {
    rpc("Button.SetConfig", { id: newId, config: cfg }, function () { cb && cb(); });
    return;
  }
  if (item.type === "group") {
    // Group config is usually just name; Group.Set sets membership
    // Some firmwares may have Group.SetConfig but not needed here.
    cb && cb();
    return;
  }
  cb && cb();
}

/*** Step 3: create desired components in order ***/
let created = {
  // alias -> { key: "number:200", id:200, type:"number", name:"..." }
  byAlias: {}
};

function createAll(done) {
  let items = DESIRED.components;
  let i = 0;

  function addNext() {
    if (i >= items.length) return done();

    let item = items[i++];
    let cfg = buildVirtualAddConfig(item);

    rpc("Virtual.Add", { type: item.type, config: cfg }, function (res, e) {
      if (!e && res && typeof res.id === "number") {
        let key = item.type + ":" + res.id;

        created.byAlias[item.alias] = {
          key: key,
          id: res.id,
          type: item.type,
          name: item.name
        };

        print("Created:", item.alias, "=>", key, "name=", item.name);

        // Force config (visibility etc.)
        forceConfig(item, res.id, function () {
          nextTick(addNext, 120);
        });
      } else {
        print("Failed creating:", item.alias, "type=", item.type, "name=", item.name);
        nextTick(addNext, 120);
      }
    });
  }

  addNext();
}

/*** Step 4: build groups from DESIRED.groups relations ***/
function setupGroups(done) {
  let rels = DESIRED.groups;
  let idx = 0;

  function setNextGroup() {
    if (idx >= rels.length) return done();

    let r = rels[idx++];
    let grp = created.byAlias[r.group];
    if (!grp) {
      print("Group alias not created:", r.group);
      return nextTick(setNextGroup, 80);
    }

    let members = [];
    for (let i = 0; i < r.members.length; i++) {
      let m = created.byAlias[r.members[i]];
      if (m) members.push(m.key);
      else print("Missing member alias:", r.members[i], "for group:", r.group);
    }

    print("Setting group", grp.key, "members:", JSON.stringify(members));
    rpc("Group.Set", { id: grp.id, value: members }, function () {
      nextTick(setNextGroup, 120);
    });
  }

  setNextGroup();
}

/*** Step 5: initialize number values ***/
function initNumbers(done) {
  if (!DESIRED.defaults || !DESIRED.defaults.numbers_to_zero) return done();

  // iterate aliases and set numbers to 0
  let aliases = [];
  for (let i = 0; i < DESIRED.components.length; i++) {
    let it = DESIRED.components[i];
    if (it.type === "number") aliases.push(it.alias);
  }

  let idx = 0;
  function setNext() {
    if (idx >= aliases.length) return done();

    let a = aliases[idx++];
    let obj = created.byAlias[a];
    if (!obj) return nextTick(setNext, 60);

    rpc("Number.Set", { id: obj.id, value: 0 }, function () {
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
      createAll(function () {
        setupGroups(function () {
          initNumbers(function () {
            print("✅ Done. Groups should be visible: Jog, Actions");
            die();
          });
        });
      });
    });
  });
}

run();
