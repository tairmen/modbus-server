const config = require('config');
const net = require('net');
const port = config.get('node.port');
const host = config.get('node.host');
const hub_code = config.get('node.code');
const hub_secret = config.get('node.secret');

module.exports = class TcpClient {
    constructor() {
        let me = this;
        me.client = new net.Socket();
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
                        console.log(json_data.config);
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
}

