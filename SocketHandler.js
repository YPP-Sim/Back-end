class SocketHandler {
  constructor(io) {
    this.io = io;
    this.firstSent = false;
  }

  registerEvents() {
    this.io.on("connection", (socket) => {
      console.log("A connection has been established.");

      socket.on("joinGame", (gameId) => {
        if (socket.room) socket.leave(socket.room);

        socket.room = gameId;
        socket.join(gameId);

        console.log("A socket joined room: ", gameId);
        if (!firstSent) {
          io.sockets.in("removal").emit("remove", "tes");
          this.firstSent = true;
        }
      });

      socket.on("leaveGame", (gameId) => {
        socket.leave(gameId);
        console.log("User left room: ", gameId);
      });

      socket.on("playerMessage", (chatData) => {
        const { message, sender, gameId } = chatData;
        io.sockets.in(gameId).emit("playerMessage", { sender, message });
      });

      socket.on("message", (data) => {
        console.log("message: ", data);
      });
    });
  }

  unregisterEvents() {}
}

module.exports = SocketHandler;
