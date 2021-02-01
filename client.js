// create an empty modbus client
// let ModbusRTU = require("modbus-serial");
// let modbusMaster = new ModbusRTU();
let TcpClient = require("./tcp_client");
const Registers = require("./registers");
const MongoClient = require('./mongo');

let mongo = new MongoClient();

let tcp = new TcpClient(mongo);

let conncted_to_db = setInterval(() => {
    if (mongo.loaded()) {
        clearInterval(conncted_to_db);
        tcp.connect((address) => {
            console.log("Connected:", address);
            tcp.send_auth();
            run();
        });
    }
}, 100);

function run() {
    let interv = setInterval(() => {
        if (tcp.config_enable()) {
            clearInterval(interv);
            run_get_data_interval();
            run_send_data_interval();
        }
    }, 100)
}

function run_get_data_interval() {
    let time_poll = tcp.config.poll_timeout;
    let devices = tcp.config.devices;
    let all_regs = [];
    devices.forEach(dev => {
        for (let key in dev.register) {
            all_regs.push({
                device_id: dev.id,
                ip: dev.ip,
                port: dev.port,
                id: dev.mb_id,
                key: key,
                start: dev.register[key].start,
                len: dev.register[key].len
            })
        }
    })
    let registers = new Registers(all_regs, time_poll);
}

function run_send_data_interval() {

}

// open modbus connection to a tcp line
// modbusMaster.connectTCP("192.168.1.5", { port: 502 });
// modbusMaster.setID(1);

// let i = 0
// setInterval(function () {
//     i += 1
//     modbusMaster.readHoldingRegisters(101, 2)
//         .then(res => {
//             console.log(res);
//         });
// }, 1000);

