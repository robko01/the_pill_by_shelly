// Robko01 TCM protocol implementation.

const BAUD = 9600;
const BPS = '8N1';
const uart = UART.get();
var last_response = '';

const CLEAR_TIME_S = 60;
var clear_counter = CLEAR_TIME_S;
var free_flag = true;

const SPEED = 232;

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

function parseQuery(qs) {
  let obj = {};
  if (!qs) return obj;

  let parts = qs.split("&");
  for (let i = 0; i < parts.length; i++) {
    let kv = parts[i].split("=");
    let key = kv[0];
    let val = kv.length > 1 ? kv[1] : "";
    obj[key] = val;
  }
  return obj;
}

function init() {
    init_tcm();

    // Software auto power OFF drives.
    feed_wdt();
    init_wdt();

    // Create a simple HTTP endpoint at /tcm
    HTTPServer.registerEndpoint("tcm", function (request, response) {

      let response_code = 200;
      let status = "ok";
      let message = "Command executed";
      let args = {};

      let qargs = parseQuery(request.query);

      if ("cmd" in qargs) {
        let cmd = qargs["cmd"];
        if (cmd == "step") {
          let velocity = parseInt(qargs["velocity"] || "100");
          let base_stp = parseInt(qargs["base"] || "0");
          let shoulder_stp = parseInt(qargs["shoulder"] || "0");
          let elbow_stp = parseInt(qargs["elbow"] || "0");
          let p_stp = parseInt(qargs["p"] || "0");
          let r_stp = parseInt(qargs["r"] || "0");
          let gripper_stp = parseInt(qargs["gripper"] || "0");
          step(velocity, base_stp, shoulder_stp, elbow_stp, p_stp, r_stp, gripper_stp);
        } else if (cmd == "home") {
          home_arm();
        } else if (cmd == "reset") {
          reset_arm();
        } else if (cmd == "read") {
          read_arm();
        } else if (cmd == "free") {
          free();
        } else if (cmd == "close_gripper") {
          close_gripper();
        } else if (cmd == "set_speed") {
          let velocity = parseInt(qargs["velocity"] || "100");
          set_arm_speed(velocity);
        } else {
          // Unknown command
          // print(qargs);
          response_code = 500;
          status = "error";
          message = "Unknown command: "+cmd;
          args = qargs;
        }
      }

      let timeout = 5000; // 5 seconds
      var counter = 0;
      while (last_response == "" && status == "ok") {
        // Wait for response to be ready.
        if (counter <= timeout) {
          counter += 1;
        } else {
          status = "error";
          response_code = 500;
          message = "Timeout waiting for response";
          break;
        }
      }
      
      response.code = response_code;
      response.body = JSON.stringify({
        status: status,
        message: message,
        response: last_response,
        args: args,
      });

      response.send();
      last_response = "";
    });
}

init();
