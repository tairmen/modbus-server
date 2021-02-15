const config = require('config');
const net = require('net');
const port = config.get('node.port');
const host = config.get('node.host');
const hub_code = config.get('node.code');
const hub_secret = config.get('node.secret');

module.exports = class TcpClient {
    constructor(mongo) {
        let me = this;
        me.mongo = mongo;
        me.client = new net.Socket();
        me.connected = false;
        me.config = null;
        me.config_recieved = false;
    }
    connect(callback = () => {}) {
        let me = this;
        function f() { 
            me.client.connect(port, host, function () {
                me.connected = true;
                me.address = me.client.address().address + ":" + me.client.address().port;
                callback(me.address);
                me.client.on('data', function (data) {
                    try {
                        console.log(data.toString())
                        let json_data = JSON.parse(data);
                        if (json_data.token) {
                            me.token = json_data.token;
                            me.send_request("config");
                        } else if (json_data.config) {
                            me.config = json_data.config;
                            me.config.devices.forEach(dev => {
                                if (typeof dev.register == "string") {
                                    let data = JSON.parse(dev.register);
                                    dev.register = data;
                                }
                            });
                            console.log("Hub config", me.config.name, "recieved");
                            me.mongo.update_devices(me.config.devices);
                            me.config_recieved = true;
                        } else if (json_data.set) {
                            let device_id = json_data.set.device_id;
                            let input = json_data.set.input;
                            let value = json_data.set.value;
                            console.log("Set data:", device_id, input, value, "recieved");
                            me.mongo.add_history_set({
                                device_id: device_id,
                                input: input,
                                value: value,
                            });
                        }
                    } catch (e) {
                        console.log(e)
                    }


                });
                me.client.on('close', function () {
                    me.connected = false;
                    console.log("Disconnected: ", me.address);
                });
            });
            me.client.on('error', function(ex) {
                me.connected = false;
                console.log("handled connection error to node server");
                me.client = new net.Socket();
                setTimeout(() => {
                    f();
                }, 10000)
            });
        }
        f();
        
    }
    send(data) {
        try {
            if (this.connected) {
                this.client.write(data);
            } else {
                console.log("Not Connected to Server");
            }
            
        } catch(e) {
            console.log("Send Error");
        }
        
    }
    send_auth() {
        let send_data = {
            auth: {
                code: hub_code,
                secret: hub_secret,
            }
        }
        let str_send_data = JSON.stringify(send_data);
        this.send(str_send_data);
        console.log("Auth sended");
    }
    send_request(name) {
        let send_data = {
            request: name,
            token: this.token,
        }
        let str_send_data = JSON.stringify(send_data);
        this.send(str_send_data);
        console.log("Config request sended");
    }
    send_data(data) {
        let send_data = {
            token: this.token,
            data: data,
        }
        let str_send_data = JSON.stringify(send_data);
        this.send(str_send_data);
        console.log("Data sended");
    }
    send_ok(message) {
        let send_data = {
            token: this.token,
            status: "ok",
            message: message
        }
        let str_send_data = JSON.stringify(send_data);
        this.send(str_send_data);
        console.log("Ok sended");
    }
    getAddr() {
        return this.address;
    }
    destroy() {
        this.client.destroy();
    }
    config_enable() {
        if (this.config_recieved) {
            this.config_recieved = false;
            return true;
        } else {
            return false;
        }
    }
}

