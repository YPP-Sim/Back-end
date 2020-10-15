const redis = require("redis");

const client = redis.createClient({
  port: process.env.REDIS_PORT,
  host: process.env.REDIS_HOST,
});

client.on("connect", () => console.log("Redis client connected"));

client.on("ready", () => console.log("Redis client ready to use"));

client.on("error", (err) => console.log("Redis error: ", err.message));

client.on("end", () => console.log("Redis client disconnected"));

module.exports = client;
