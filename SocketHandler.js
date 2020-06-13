const gameHandler = require("./games-handler");
const PlayerShip = require("./game/PlayerShip");
const GameStatus = require("./game/GameStatus");
const ShipType = require("./game/ShipType");

function getGameData(game) {
  const gameData = {
    players: [],
    gameOwner: game.gameOwner,
    status: game.getStatus(),
  };

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

  return gameData;
}

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

        this.io.to(gameId).emit("gameData", getGameData(game));
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
        this.io.in(gameId).emit("gameData", getGameData(game));
      });

      socket.on("disconnect", () => {
        const socketId = socket.id;
        if (this.playerSockets[socketId]) {
          const { playerName, gameId } = this.playerSockets[socketId];
          console.log(`Player ${playerName} has disconnected`);

          const game = gameHandler.getGame(gameId);

          game.removePlayer(playerName);
          this.io.in(gameId).emit("gameMessage", `${playerName} left the game`);
          this.io.in(gameId).emit("gameData", getGameData(game));
        }
      });

      socket.on("joinTeam", ({ playerName, gameId, side }) => {
        const game = gameHandler.getGame(gameId);
        if (!game) {
          socket.emit("gameError", `Game ${gameId} does not exist`);
          return;
        }
        switch (side) {
          case "ATTACKER":
            if (game.isDefender(playerName)) game.removeDefender(playerName);
            game.addAttacker(playerName);

            break;
          case "DEFENDER":
            if (game.isAttacker(playerName)) game.removeAttacker(playerName);
            game.addDefender(playerName);
            break;
          case "UNDECIDED":
          default:
            break;
        }
        this.io.to(gameId).emit("gameData", getGameData(game));
      });

      socket.on("playerChangeShip", ({ playerName, gameId, shipType }) => {
        const game = gameHandler.getGame(gameId);
        if (!game) {
          socket.emit("gameError", `Game ${gameId} does not exist!`);
          return;
        }
        const player = game.getPlayer(playerName);

        if (!player.ship) {
          player.ship = new PlayerShip(playerName, ShipType[shipType]);
        } else {
          player.ship.shipType = ShipType[shipType];
        }

        this.io.to(gameId).emit("gameData", getGameData(game));
      });

      socket.on("playerMessage", (chatData) => {
        const { message, sender, gameId } = chatData;
        this.io.sockets.in(gameId).emit("playerMessage", { sender, message });
      });

      socket.on("startGame", ({ gameId }) => {
        const game = gameHandler.getGame(gameId);
        if (!game) {
          socket.emit("gameError", `Game does not exist: ${gameId}`);
          return;
        }

        game.gameStatus = GameStatus.INGAME;

        game.start();

        const startingData = getGameData(game);
        this.io.to(gameId).emit("startGame", startingData);
      });

      socket.on("message", (data) => {
        console.log("message: ", data);
      });
    });
  }

  unregisterEvents() {}
}

module.exports = SocketHandler;
