const config = require('config');
const { MongoClient } = require("mongodb");
const url = config.get('mongo.url');
const dbName = config.get('mongo.db');

const client = new MongoClient(url);

module.exports = class Mongo {
    connect(callback = () => {}) {
        client.connect((err) => {
            console.log("Connected successfully to mongo");
            const db = client.db(dbName);
            callback();
        })
    }
}