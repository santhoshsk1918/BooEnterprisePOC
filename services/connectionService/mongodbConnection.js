const { MongoClient } = require('mongodb');

const dotenv = require('dotenv');
dotenv.config();

const url = process.env.MONOGDBURL;

const client = new MongoClient(url);
let connnection;

async function getConnection() {
    if(connnection) {
        return connnection
    } else {
        connnection = await client.connect()
        return connnection;
    }
}

module.exports.getCollection = async (database, collection) => {
    let connect = await getConnection()
    let db = connect.db(database);
    return db.collection(collection);
}