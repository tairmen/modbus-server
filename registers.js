// create an empty modbus client
const { EWOULDBLOCK } = require("constants");
let ModbusRTU = require("modbus-serial");

module.exports = class Registers {
    constructor(regs, time_poll, mongo) {
        this.mongo = mongo;
        this.init(regs, time_poll);
    }
    init(regs, time_poll) {
        let me = this;
        me.regs = regs;
        me.time_poll = time_poll;
        if (me.interv) {
            clearInterval(me.interv);
        }
        me.modbusMasters = [];
        let masters_counter = 0;
        if (me.regs.length > 0) {
            let addr = me.regs[0].ip +  me.regs[0].port;
            let ips = new Set([ addr ]);
            let modbusMaster = new ModbusRTU();
            modbusMaster.connectTCP(me.regs[0].ip, { port: me.regs[0].port });
            me.modbusMasters.push(modbusMaster);
            me.regs[0].master_index = masters_counter;
            for (let i = 1; i < me.regs.length; i++) {
                let reg = me.regs[i];
                let addr = reg.ip +  reg.port;
                if (!ips.has(addr)) {
                    ips.add(addr);
                    let modbusMaster = new ModbusRTU();
                    modbusMaster.connectTCP(reg.ip, { port: reg.port });
                    me.modbusMasters.push(modbusMaster);
                    masters_counter += 1;
                }
                me.regs[i].master_index = masters_counter;
            }
        }
        me.interv = setInterval(async () => {
            await me.read_registers()
                .catch((error) => {
                    console.error(error)
                });
        }, me.time_poll);
    }
    async read_registers() {
        let me = this;
        let readed_data = {};
        for (let i = 0; i < me.regs.length; i++) {
            let reg = me.regs[i];
            let currMaster = me.modbusMasters[reg.master_index];
            // console.log(reg.device_id, reg.id, reg.start, reg.len)
            currMaster.setID(reg.id);
            let res = await currMaster.readHoldingRegisters(reg.start, reg.len);
            if (!readed_data[reg.device_id]) {
                readed_data[reg.device_id] = [];
            }
            readed_data[reg.device_id].push({
                key: reg.key,
                reg_addr: reg.start,
                data: res.data,
                created_at: (new Date()).getTime(),
            })
            // console.log(res);
        }
        me.mongo.add_history(readed_data);
        console.log("History added");
    }
    read_reg(addr, len, callback = () => { }) {
        this.modbusMaster.readHoldingRegisters(addr, len)
            .then(res => {
                console.log(res)
                callback()
            })
    }
    write_reg(device_id, key, val) {
        let me = this;
        let reg = me.regs.find(el => {
            return el.device_id == device_id && el.key == key;
        })
        let currMaster = me.modbusMasters[reg.master_index];
        currMaster.setID(reg.id);
        currMaster.writeRegisters(reg.start, [val]);
    }
}