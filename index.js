module.exports = {
  getSocketIO,
};

const dotenv = require("dotenv");
if (dotenv) dotenv.config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();
const http = require("http").createServer(app);
const https = require("https");
const io = require("socket.io")(http);
const SocketHandler = require("./SocketHandler");

const gamesRouter = require("./routes/games-router");
const mapRouter = require("./routes/maps-router");

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

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Works!", environment: process.env.NODE_ENV });
});

// --- Server start/listen
http.listen(port, () => {
  console.log(`Listening on port: ${port}`);

  if (!process.env.JWT_KEY)
    console.warn(
      "JWT Key not found, please set a JWT_KEY environment variable"
    );
});

// HTTPS server setup
if (process.env.NODE_ENV === "production") {
  // Certificate
  const privateKey = fs.readFileSync(process.env.PRIVATE_KEY_PATH, "utf8");
  const certificate = fs.readFileSync(process.env.CERTIFICATE_PATH, "utf8");
  const ca = fs.readFileSync(process.env.CA_PATH, "utf8");

  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca,
  };

  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(443, () => {
    console.log("HTTPS Server has been set up and now listening on port 443");
  });
}
