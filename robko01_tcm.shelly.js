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

function set_arm_speed(){
    uart.write("@SET\n");
}

function step(speed_stp, base_stp, shoulder_stp, elbow_stp, p_stp, r_stp, gripper_stp){
    // Combined elbow and shoulder for q3.
    let q3 = elbow_stp + shoulder_stp

    // Diff drive for wrist.
    let q4 = (p_stp + r_stp) * -1;
    let q5 = (p_stp - r_stp) * 1;

    // Gripper relative to elbow.
    let q6 = gripper_stp - elbow_stp

    let outputs = 0;
    let cmd = "@STEP " + 
    speed_stp + "," + 
    base_stp + "," +
    shoulder_stp + "," +
    q3 + "," +
    q4 + "," +
    q5 + "," +
    q6 + "," +
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
    if (!data || !data.length) return;

    if (data.length === 1 && (data.charCodeAt(0) & 0xff) === 0xf1)
    {
        return;
    }

    if (last_response != data){
        last_response = data;
    }
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

// step(100, 0, 0, 0, 0, 0, 0);