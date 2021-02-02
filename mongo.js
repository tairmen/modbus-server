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
let set_data = 0;

module.exports = class Mongo {
    constructor() {
        let me = this;
        me.db = db;
    }
    update_devices(devices, callback = () => { }) {
        const collection = this.db.collection("device");
        collection.remove({}, (result) => {
            collection.insertMany(devices, { ordered: true }, (res) => {
                callback();
            });
        });
    }
    add_history(sensors_data, callback = () => { }) {
        const collection = this.db.collection("history");
        let data = { data: sensors_data, send_status: false };
        collection.insertOne(data, { ordered: true }, (result) => {
            callback();
        });
    }
    async get_from_history(callback = () => { }) {
        const collection = this.db.collection("history");
        const cursor = collection.find({ send_status: false });
        const allValues = await cursor.toArray();
        return allValues;
    }
    async set_sended(data, callback = () => { }) {
        const collection = this.db.collection("history");
        let filter = [];
        data.forEach(id => {
            filter.push({_id: id});
        });
        await collection.updateMany({ $or: filter }, {$set: { send_status: true }}, { upsert: true });
    }
    add_history_set(data, callback = () => { }) {
        const collection = this.db.collection("history_set");
        let ins_data = { data: data, status: false, recieved_at: (new Date()).getTime() };
        collection.insertOne(ins_data, { ordered: true }, (result) => {
            callback();
            set_data += 1;
        });
    }
    async get_history_set(callback = () => { }) {
        const collection = this.db.collection("history_set");
        const cursor = collection.find({ status: false });
        const allValues = await cursor.toArray();
        return allValues;
    }
    async set_history_set(data, callback = () => { }) {
        const collection = this.db.collection("history_set");
        let filter = [];
        data.forEach(id => {
            filter.push({_id: id});
        });
        await collection.updateMany({ $or: filter }, {$set: { status: true }}, { upsert: true });
    }
    loaded() {
        if (db) {
            this.db = db;
            return true;
        } else {
            return false;
        }
    }
    set_enable() {
        if (set_data > 0) {
            set_data = 0;
            return true;
        } else {
            return false;
        }
    }
}