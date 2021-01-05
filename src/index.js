module.exports = {
  getSocketIO,
};
// Init
require("./helpers/init_mongodb");
require("./helpers/init_redis");

const express = require("express");
const cors = require("cors");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const SocketHandler = require("./SocketHandler");

//Routes
const gamesRouter = require("./routes/games-router");
const mapRouter = require("./routes/maps-router");
const authRouter = require("./routes/auth-router");
const userRouter = require("./routes/user-router");

const package = require("../package.json");

const port = process.env.PORT || 4000;

const socketHandler = new SocketHandler(io);
socketHandler.registerEvents();

function getSocketIO() {
  return io;
}

// Global middleware
app.use(express.json());
app.use(cors());
// --- Routes
app.use("/games", gamesRouter);
app.use("/maps", mapRouter);
app.use("/user", userRouter);
app.use("/auth", authRouter);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Works!",
    environment: process.env.NODE_ENV,
    version: package.version,
  });
});

// --- Server start/listen
http.listen(port, () => {
  console.log(`Listening on port: ${port}`);
  console.log(`Server version: ${package.version}`);
  if (!process.env.JWT_KEY)
    console.warn(
      "JWT Key not found, please set a JWT_KEY environment variable"
    );
});
