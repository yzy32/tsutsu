require("dotenv").config({ path: `${__dirname}/../.env` });
const redis = require("redis");

let redisAddress = `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.IP}:${process.env.REDIS_PORT}`;
if (process.env.NODE_ENV == "docker") {
  redisAddress = `redis://${process.env.REDIS_USER}:${process.env.REDIS_PASSWORD}@${process.env.CONTAINER_REDIS}:${process.env.REDIS_PORT}`;
}
// for local host
const redisClient = redis.createClient({
  url: redisAddress,
  socket: {
    keepAlive: false,
  },
});

redisClient.ready = false;

redisClient.on("ready", () => {
  redisClient.ready = true;
  console.log("Redis is ready");
});

redisClient.on("error", () => {
  redisClient.ready = false;
});

redisClient.on("end", () => {
  redisClient.ready = false;
  console.log("Redis is disconnected");
});

redisClient.connect();

module.exports = redisClient;
