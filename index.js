module.exports = {
  getSocketIO,
};

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const onCommand = require("./socket-commands");

const gamesRouter = require("./routes/games-router");

const port = process.env.PORT || 4000;

function getSocketIO() {
  return io;
}

// Global middleware
app.use(express.json());

// --- Routes
app.use("/games", gamesRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Works!" });
});

// --- Web Sockets
io.on("connection", (socket) => {
  console.log("A connection has been established...");

  socket.on("clientCommand", (command, args) => {
    console.log("Client command: " + command, ", Args: " + args);
    onCommand(command, args, socket, io);
  });

  socket.on("joinGame", (gameId) => {
    if (socket.room) socket.leave(socket.room);

    socket.room = gameId;
    socket.join(gameId);

    console.log("A socket joined room: ", gameId);
    // io.sockets.in(gameId).emit("message", "A new user joined!");
    socket.emit("message", "Test");
    emitToRoom(gameId, "message", "A new user joined room: " + gameId);
  });

  socket.on("message", (data) => {
    console.log("message: ", data);
  });
});

// --- Server start/listen
http.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});
