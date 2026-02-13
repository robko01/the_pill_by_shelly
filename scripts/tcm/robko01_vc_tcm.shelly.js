// Robko01 TCM protocol implementation.

const BAUD = 9600;
const BPS = '8N1';
const uart = UART.get();
var last_response = '';

const CLEAR_TIME_S = 60;
var clear_counter = CLEAR_TIME_S;
var free_flag = true;

const SPEED = 232;

const VC_BASE = Virtual.getHandle('number:200');
const VC_SHOULDER = Virtual.getHandle('number:201');
const VC_ELBOW = Virtual.getHandle('number:202');
const VC_P = Virtual.getHandle('number:203');
const VC_R = Virtual.getHandle('number:204');
const VC_GRIPPER = Virtual.getHandle('number:205');
const VC_BTN_GO = Virtual.getHandle('button:200');
const VC_BTN_CLEAR = Virtual.getHandle('button:201');

function close_gripper(){
    uart.write("@CLOSE\n");
}

function read_arm(){
    uart.write("@READ\n");
}

function reset_arm(){
    uart.write("@RESET\n");
}

function set_arm_speed(velocity){
    uart.write("@SET " + velocity + "\n");
}

function step(velocity, base_stp, shoulder_stp, elbow_stp, p_stp, r_stp, gripper_stp){
    let scales = [1, 1, 1, 1, 1, 1]

    // Combined elbow and shoulder for q3.
    let q3 = elbow_stp + shoulder_stp; // *1.67

    // Diff drive for wrist.
    let q4 = (p_stp + r_stp) * -1;
    let q5 = (p_stp - r_stp) * 1;

    // Gripper relative to elbow.
    let q6 = gripper_stp - q3;

    let outputs = 0;
    let cmd = "@STEP " + 
    velocity + "," + 
    base_stp*scales[0] + "," +
    shoulder_stp*scales[1] + "," +
    q3*scales[2] + "," +
    q4*scales[3] + "," +
    q5*scales[4] + "," +
    q6*scales[5] + "," +
    outputs + "\n";

    feed_wdt();

    uart.write(cmd);
}

function free(){
    uart.write("FREE\n");
}

function home_arm(){
    uart.write("@HOME\n");
}

function uart_recv(data) {
    last_response = data;
    print(data);
}

function init_tcm(){
    if (uart.configure({ baud: BAUD, mode: BPS })){
        print('UART @', BAUD, BPS);
        // Attach UART receive handler.
        uart.recv(uart_recv);
    }else{
        die();
    }
    read_arm();
}

function init_wdt(){    
    Timer.set(1000, true, function() {
        if (clear_counter > 0)
        {
            clear_counter -= 1;
            free_flag = true;
        } else {
            if (free_flag){
                free_flag = false;
                free();
            }
        }
        // print(clear_counter);
    });
}

function feed_wdt() {
    // Feed the counter.
    clear_counter = CLEAR_TIME_S;
}

function init() {
    init_tcm();

    VC_BTN_GO.on("single_push", function(ev) { 
        step(SPEED,
        VC_BASE.getValue(),
        VC_SHOULDER.getValue(),
        VC_ELBOW.getValue(),
        VC_P.getValue(),
        VC_R.getValue(),
        VC_GRIPPER.getValue());
    });

    VC_BTN_CLEAR.on("single_push", function(ev){
        VC_BASE.setValue(0);
        VC_SHOULDER.setValue(0);
        VC_ELBOW.setValue(0);
        VC_P.setValue(0);
        VC_R.setValue(0);
        VC_GRIPPER.setValue(0);

        step(SPEED,0,0,0,0,0,0);
    });

    // Software auto power OFF drives.
    feed_wdt();
    init_wdt();
}

init();


let sequence = [
  {
    delay: 7000,
    fn: function () {
      step(100, 0, 0, 0, 0, 0, 0);
      print("Step 1 executed");
    }
  },
  {
    delay: 7000,
    fn: function () {
      step(100, -500, -250, 400, 0, 0, 0);
      print("Step 2 executed");
    }
  },
  {
    delay: 7000,
    fn: function () {
      step(100, -500, -100, 400, 0, 0, 0);
      print("Step 3 executed");
    }
  },
  {
    delay: 7000,
    fn: function () {
      step(100, 0, 0, 0, 0, 0, 0);
      print("Return to home.");
    }
  }
];

let index = 0;

function go_for_candy() {
  // Reset index in case the function is called again.
  index = 0;

  function runNextStep() {
    if (index >= sequence.length) {
      print("🍬 Candy mission finished!");
      return; // stops completely
    }

    let item = sequence[index++];

    // Execute step
    item.fn();

    // Schedule next step after this step's delay
    Timer.set(item.delay, false, runNextStep);
  }

  // Start sequence
  runNextStep();
}

// go_for_candy();
// step(100, 0, 0, 0, 0, 0, 0);
// step(100, -500, -250, 400, 0, 0, 0);
// step(100, -500, -100, 400, 0, 0, 0);
