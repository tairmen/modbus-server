// create an empty modbus client
// let ModbusRTU = require("modbus-serial");
// let modbusMaster = new ModbusRTU();
let TcpClient = require("./tcp_client");
const Registers = require("./registers");
const MongoClient = require('./mongo');

let mongo = new MongoClient();

let tcp = new TcpClient(mongo);

let registers, send_interv, set_data_interv;

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
    setInterval(() => {
        if (tcp.config_enable()) {
            if (registers) {
                clearInterval(registers.interv);
                registers = null;
            }
            if (send_interv) {
                clearInterval(send_interv);
            }
            if (set_data_interv) {
                clearInterval(set_data_interv);
            }
            run_get_data_interval();
            run_send_data_interval();
            listen_set_data();
        }
    }, 200)
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
                start: dev.register[key],
                len: 1
            })
        }
    })
    registers = new Registers(all_regs, time_poll, mongo);
}

function run_send_data_interval() {
    let time_send = tcp.config.send_timeout;
    send_interv = setInterval(async () => {
        let values = await mongo.get_from_history();
        let ids = [];
        values.forEach(el => {
            ids.push(el._id);
        })
        tcp.send_data(values);
        mongo.set_sended(ids);
    }, time_send)
}

function listen_set_data() {
    set_data_interv = setInterval(async () => {
        if (mongo.set_enable()) {
            let values = await mongo.get_history_set();
            for (let i = 0; i < values.length; i++) {
                let data = values[i].data;
                console.log("changed registry", data.device_id, data.input, data.value);
                registers.write_reg(data.device_id, data.input, data.value);
            }
            let ids = [];
            values.forEach(el => {
                ids.push(el._id);
            })
            tcp.send_ok("registry has been set");
            mongo.set_history_set(ids);
        }
    }, 500)
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

