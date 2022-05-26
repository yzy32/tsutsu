require("dotenv").config({ path: `${__dirname}/../.env` });
const path = require("path");
const fs = require("fs");
const { Client, ConnectionPool } = require("@elastic/elasticsearch");

let esAddress = `https://${process.env.IP}:${process.env.ES_PORT}`;
if (process.env.NODE_ENV == "docker") {
  esAddress = `https://${process.env.CONTAINER_ES}:${process.env.ES_PORT}`;
}

const es = new Client({
  node: esAddress,
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
