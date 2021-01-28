const config = require('config');
const net = require('net');
const port = config.get('port');
const host = config.get('host');

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
                        let send_data = JSON.stringify({
                            token: json_data.token
                        });
                        me.client.write(send_data);
                    }
                } catch (e) {
                    console.log(e)
                }


            });
            me.client.on('close', function () {
            });
        });
    }
    send(data) {
        this.client.write(data);
    }
    getAddr() {
        return this.address;
    }
    destroy() {
        this.client.destroy();
    }
}

