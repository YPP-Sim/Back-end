const gameHandler = require("./games-handler");

class SocketHandler {
  constructor(io) {
    this.io = io;
    this.firstSent = false;

    this.playerSockets = {};
  }

  registerEvents() {
    this.io.on("connection", (socket) => {
      socket.on("joinGame", ({ gameId, playerName }) => {
        // Pair the socket with a player
        this.playerSockets[socket.id] = { playerName, gameId };
        const game = gameHandler.getGame(gameId);
        if (!game) {
          socket.emit("gameError", `Game '${gameId}' does not exist!`);
          return;
        }

        game.addPlayer(playerName);

        if (socket.room) socket.leave(socket.room);

        socket.room = gameId;
        socket.join(gameId);

        console.log(`Player ${playerName} joined game: '${gameId}'`);

        if (!this.firstSent) {
          this.io.sockets.in("removal").emit("remove", "tes");
          this.firstSent = true;
        }

        this.io.sockets
          .in(gameId)
          .emit("gameMessage", `${playerName} has joined the game`);

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

      socket.on("leaveGame", ({ gameId, playerName }) => {
        socket.leave(gameId);
        console.log("User left room: ", gameId);
        const game = gameHandler.getGame(gameId);

        if (!game) {
          socket.emit("gameError", `Game '${gameId}' does not exist!`);
          return;
        }

        game.removePlayer(playerName);
        this.io.in(gameId).emit("gameMessage", `${playerName} left the game`);
      });

      socket.on("disconnect", (reason) => {
        const socketId = socket.id;
        if (this.playerSockets[socketId]) {
          const { playerName, gameId } = this.playerSockets[socketId];
          console.log(`Player ${playerName} has disconnected`);

          const game = gameHandler.getGame(gameId);

          game.removePlayer(playerName);
          this.io.in(gameId).emit("gameMessage", `${playerName} left the game`);
        }
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
