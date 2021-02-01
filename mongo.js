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
        data.forEach(element => {
            filter.push({_id: element._id});
        });
        await collection.updateMany({ $or: filter }, {$set: { send_status: true }}, { upsert: true });
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