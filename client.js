// create an empty modbus client
let ModbusRTU = require("modbus-serial");
let modbusMaster = new ModbusRTU();
const MongoClient = require('mongodb').MongoClient;
let TcpClient = require("./tcp_client");

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'hubdb';

// Use connect method to connect to the server
MongoClient.connect(url, function (err, client) {
    console.log("Connected successfully to server");

    const db = client.db(dbName);

    client.close();
});

let tcp = new TcpClient();
tcp.connect((address) => {
    console.log("Connected:", address);
});

// open connection to a tcp line
modbusMaster.connectTCP("0.0.0.0", { port: 502 });

modbusMaster.setID(1);

// read the values of 10 registers starting at address 0
// on device number 1. and log the values to the console.
let i = 0
setInterval(function () {
    i += 1
    modbusMaster.writeRegisters(0, [i]);
}, 1000);

