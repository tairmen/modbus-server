const config = require('config');
const { MongoClient } = require("mongodb");
const url = config.get('mongo.url');
const dbName = config.get('mongo.db');

const client = new MongoClient(url);

module.exports = class Mongo {
    connect(callback = () => {}) {
        let me = this;
        client.connect((err) => {
            console.log("Connected successfully to mongo");
            me.db = client.db(dbName);
            callback();
        })
    }
    update_devices(devices, callback = () => {}) {
        const collection = this.db.collection("device");
        devices.forEach(dev => {
            if (typeof dev.register == "string") {
                let data = JSON.parse(dev.register);
                dev.register = data;
            }
        });
        collection.remove({}, (result) => {
            collection.insertMany(devices, { ordered: true }, (res) => {
                callback();
            });
        });
    }
    add_history(sensors_data, callback = () => {}) {
        const collection = this.db.collection("device");
        collection.insertMany(sensors_data, { ordered: true }, (result) => {
            callback();
        });
    }
    get_from_history() {

    }
}