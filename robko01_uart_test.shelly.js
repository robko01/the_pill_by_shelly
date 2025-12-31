const BAUD = 9600;
const BPS = '8N1';
const uart = UART.get();

function init(){
   if (uart.configure({ baud: BAUD, mode: BPS })){
       print('UART @', BAUD, BPS);
       uart.recv(function(data) {
         print(data);
       });
   }else{
       die();
   }
   Timer.set(1000, true, function() {
      uart.write("TEST\n");
   });
}

init();