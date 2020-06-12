const gameHandler = require("./games-handler");

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.firstSent = false;
  }

  registerEvents() {
    this.io.on("connection", (socket) => {
      console.log("A connection has been established.");

      socket.on("joinGame", ({ gameId, playerName }) => {
        const game = gameHandler.getGame(gameId);
        if (!game) {
          socket.emit("error", `Game '${gameId}' does not exist!`);
          return;
        }

        game.addPlayer(playerName);

        if (socket.room) socket.leave(socket.room);

        socket.room = gameId;
        socket.join(gameId);

        console.log("A socket joined room: ", gameId);
        if (!firstSent) {
          this.io.sockets.in("removal").emit("remove", "tes");
          this.firstSent = true;
        }

        const gameData = { players: [], status: game.getStatus() };

        for (let player of game.getPlayerList()) {
          let shipData;
          if (player.getShip()) {
            shipData = player.getShip().getShipStats();
          }
          const pData = {
            playerName: player.getName(),
            side: player.getSide(game),
            shipData,
          };
          gameData.players.push(pData);
        }

        socket.emit("gameData", gameData);
      });

      socket.on("leaveGame", (gameId) => {
        socket.leave(gameId);
        console.log("User left room: ", gameId);
      });

      socket.on("playerMessage", (chatData) => {
        const { message, sender, gameId } = chatData;
        this.io.sockets.in(gameId).emit("playerMessage", { sender, message });
      });

      socket.on("message", (data) => {
        console.log("message: ", data);
      });
    });
  }

  unregisterEvents() {}
}

module.exports = SocketHandler;
