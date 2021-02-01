const config = require('config');
const { MongoClient } = require("mongodb");
const url = config.get('mongo.url');
const dbName = config.get('mongo.db');

const client = new MongoClient(url);
let db = null;
client.connect((err) => {
    console.log("Connected successfully to mongo");
    db = client.db(dbName);
})

module.exports = class Mongo {
    constructor() {
        let me = this;
        me.db = db;
    }
    update_devices(devices, callback = () => {}) {
        const collection = this.db.collection("device");
        collection.remove({}, (result) => {
            collection.insertMany(devices, { ordered: true }, (res) => {
                callback();
            });
        });
    }
    add_history(sensors_data, callback = () => {}) {
        const collection = this.db.collection("device");
        let data = [];
        collection.insertMany(sensors_data, { ordered: true }, (result) => {
            callback();
        });
    }
    get_from_history(callback = () => {}) {
        const collection = this.db.collection("device");
        collection.find({ send_status: false }, { ordered: true }, (result) => {
            console.log(result);
            callback();
        });
    }
    loaded() {
        if (db) {
            this.db = db;
            return true;
        } else {
            return false;
        }
    }
}