// Virtual components setup for Robko01 TCM voice control
// This script creates all graphical UI components used by robko01_vc_tcm.shelly.js
// Auto-stops after all components are created

// Material icons from https://material-icons.github.io
const ICONS = {
  base: "https://material-icons.github.io/material-icons-png/png/white/360/baseline.png",
  shoulder: "https://material-icons.github.io/material-icons-png/png/white/arrow_upward/baseline.png",
  elbow: "https://material-icons.github.io/material-icons-png/png/white/unfold_more/baseline.png",
  pitch: "https://material-icons.github.io/material-icons-png/png/white/flip/baseline.png",
  roll: "https://material-icons.github.io/material-icons-png/png/white/rotate_left/baseline.png",
  gripper: "https://material-icons.github.io/material-icons-png/png/white/pan_tool/baseline.png",
  play: "https://material-icons.github.io/material-icons-png/png/white/play_arrow/baseline.png",
  clear: "https://material-icons.github.io/material-icons-png/png/white/clear/baseline.png"
};

let completionCounter = 0;
const TOTAL_COMPONENTS = 8; // 6 number controls + 2 buttons

function stopScript() {
  print("All components created successfully! Disabling this setup script...");
  Shelly.call(
    "Script.SetConfig",
    { id: Shelly.getCurrentScriptId(), config: { enable: false } },
    function(result, error_code, error_msg) {
      if (error_code === 0) {
        print("Setup script disabled.");
      } else {
        print("Could not disable script:", error_msg);
      }
    }
  );
}

function checkCompletion() {
  completionCounter++;
  if (completionCounter === TOTAL_COMPONENTS) {
    Timer.set(1000, false, stopScript); // Wait 1 second before stopping
  }
}

function createComponents() {
  // Create number controls for arm movement parameters
  
  // Base rotation
  Shelly.call(
    "Virtual.Create",
    {
      id: 200,
      type: "number",
      config: {
        name: "Base",
        group: "jog",
        min: -500,
        max: 500,
        step: 10,
        meta: { ui: { icon: ICONS.base } }
      }
    },
    function(result, error_code, error_msg) {
      if (error_code !== 0) {
        print("Error creating Base control:", error_msg);
      } else {
        print("Base control created");
        checkCompletion();
      }
    }
  );

  // Shoulder
  Shelly.call(
    "Virtual.Create",
    {
      id: 201,
      type: "number",
      config: {
        name: "Shoulder",
        group: "jog",
        min: -500,
        max: 500,
        step: 10,
        meta: { ui: { icon: ICONS.shoulder } }
      }
    },
    function(result, error_code, error_msg) {
      if (error_code !== 0) {
        print("Error creating Shoulder control:", error_msg);
      } else {
        print("Shoulder control created");
        checkCompletion();
      }
    }
  );

  // Elbow
  Shelly.call(
    "Virtual.Create",
    {
      id: 202,
      type: "number",
      config: {
        name: "Elbow",
        group: "jog",
        min: -500,
        max: 500,
        step: 10,
        meta: { ui: { icon: ICONS.elbow } }
      }
    },
    function(result, error_code, error_msg) {
      if (error_code !== 0) {
        print("Error creating Elbow control:", error_msg);
      } else {
        print("Elbow control created");
        checkCompletion();
      }
    }
  );

  // Pitch (P)
  Shelly.call(
    "Virtual.Create",
    {
      id: 203,
      type: "number",
      config: {
        name: "Pitch",
        group: "jog",
        min: -500,
        max: 500,
        step: 10,
        meta: { ui: { icon: ICONS.pitch } }
      }
    },
    function(result, error_code, error_msg) {
      if (error_code !== 0) {
        print("Error creating Pitch control:", error_msg);
      } else {
        print("Pitch control created");
        checkCompletion();
      }
    }
  );

  // Roll (R)
  Shelly.call(
    "Virtual.Create",
    {
      id: 204,
      type: "number",
      config: {
        name: "Roll",
        group: "jog",
        min: -500,
        max: 500,
        step: 10,
        meta: { ui: { icon: ICONS.roll } }
      }
    },
    function(result, error_code, error_msg) {
      if (error_code !== 0) {
        print("Error creating Roll control:", error_msg);
      } else {
        print("Roll control created");
        checkCompletion();
      }
    }
  );

  // Gripper
  Shelly.call(
    "Virtual.Create",
    {
      id: 205,
      type: "number",
      config: {
        name: "Gripper",
        group: "jog",
        min: -500,
        max: 500,
        step: 10,
        meta: { ui: { icon: ICONS.gripper } }
      }
    },
    function(result, error_code, error_msg) {
      if (error_code !== 0) {
        print("Error creating Gripper control:", error_msg);
      } else {
        print("Gripper control created");
        checkCompletion();
      }
    }
  );

  // Create buttons for actions

  // Go button (execute movement)
  Shelly.call(
    "Virtual.Create",
    {
      id: 200,
      type: "button",
      config: {
        name: "Go",
        group: "action",
        meta: { ui: { icon: ICONS.play } }
      }
    },
    function(result, error_code, error_msg) {
      if (error_code !== 0) {
        print("Error creating Go button:", error_msg);
      } else {
        print("Go button created");
        checkCompletion();
      }
    }
  );

  // Clear button (reset all values)
  Shelly.call(
    "Virtual.Create",
    {
      id: 201,
      type: "button",
      config: {
        name: "Clear",
        group: "action",
        meta: { ui: { icon: ICONS.clear } }
      }
    },
    function(result, error_code, error_msg) {
      if (error_code !== 0) {
        print("Error creating Clear button:", error_msg);
      } else {
        print("Clear button created");
        checkCompletion();
      }
    }
  );


// Run setup on startup
createComponents();
