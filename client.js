// create an empty modbus client
let ModbusRTU = require("modbus-serial");
let modbusMaster = new ModbusRTU();
let TcpClient = require("./tcp_client");

let tcp = new TcpClient();

tcp.connect((address) => {
    console.log("Connected:", address);
    tcp.send_auth();
});


// open modbus connection to a tcp line
// modbusMaster.connectTCP("0.0.0.0", { port: 502 });
// modbusMaster.setID(1);

// let i = 0
// setInterval(function () {
//     i += 1
//     modbusMaster.writeRegisters(0, [i]);
// }, 1000);

