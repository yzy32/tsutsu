require("dotenv").config();
const path = require("path");
const fs = require("fs");
const { Client, ConnectionPool } = require("@elastic/elasticsearch");

const es = new Client({
  node: `https://${process.env.IP}:${process.env.ES_PORT}`,
  auth: {
    username: `${process.env.ES_USER}`,
    password: `${process.env.ES_PWD}`,
  },
  tls: {
    ca: fs.readFileSync(path.join(__dirname, "../es_http_ca.crt")),
    rejectUnauthorized: false,
  },
});
async function clientInfo() {
  try {
    const info = await es.info();
    console.log(info);
  } catch (error) {
    console.log(error);
  }
}

// clientInfo();
module.exports = es;
