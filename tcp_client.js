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
        me.config = null;
        me.config_recieved = false;
    }
    connect(callback = () => {}) {
        let me = this;
        me.client.connect(port, host, function () {
            me.address = me.client.address().address + ":" + me.client.address().port;
            callback(me.address);
            me.client.on('data', function (data) {
                try {
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
                        console.log(me.config);
                        me.mongo.update_devices(me.config.devices);
                        me.config_recieved = true;
                    } else if (json_data.set) {
                        let device_id = json_data.set.device_id;
                    }
                } catch (e) {
                    console.log(e)
                }


            });
            me.client.on('close', function () {
                console.log("Disconnected: ", me.address);
            });
        });
    }
    send(data) {
        this.client.write(data);
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
    }
    send_request(name) {
        let send_data = {
            request: name,
            token: this.token,
        }
        let str_send_data = JSON.stringify(send_data);
        this.send(str_send_data);
    }
    send_data(data) {
        let send_data = {
            token: this.token,
            data: data,
        }
        let str_send_data = JSON.stringify(send_data);
        this.send(str_send_data);
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

