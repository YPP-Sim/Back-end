const gameHandler = require("./games-handler");
const PlayerShip = require("./game/PlayerShip");
const GameStatus = require("./game/GameStatus");
const ShipType = require("./game/ShipType");
const util = require("./game/util");
const Move = require("./game/moves/Move");
const Direction = require("./game/Direction");

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

    this.actionAmountCache = {};
  }

  handleActionUpdates(player, cb) {
    const activeTurns = player.getMoves().getActiveTurnAmount();
    let prevTurns = -1;
    if (this.actionAmountCache[player.playerName])
      prevTurns = this.actionAmountCache[player.playerName];

    if (prevTurns !== activeTurns) cb(activeTurns);
    this.actionAmountCache[playerName] = activeTurns;
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
          if (!game) {
            console.log(
              "Trying to disconnect from a game that does not exist: ",
              gameId
            );
            return;
          }
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

      socket.on("requestMap", ({ gameId }) => {
        const game = gameHandler.getGame(gameId);
        if (!game) {
          socket.emit("gameError", `Game ${gameId} does not exist`);
          return;
        }
        socket.emit("gameMap", gameHandler.getGame(gameId).rawMap);
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
        startingData.map = game.rawMap;
        this.io.to(gameId).emit("startGame", startingData);
      });

      socket.on("setMove", ({ gameId, playerName, moveData }) => {
        const game = gameHandler.getGame(gameId);

        if (!game) {
          socket.emit("gameError", `Game ${gameId} does not exist!`);
          return;
        }

        const player = game.getPlayer(playerName);
        if (!player) {
          socket.emit("gameError", `Player ${playerName} does not exist!`);
          return;
        }

        const { moveNumber, direction, leftGuns, rightGuns } = moveData;

        const move = new Move(Direction[direction], playerName);

        if (leftGuns) move.setLeftGuns(leftGuns);
        if (rightGuns) move.setRightGuns(rightGuns);

        switch (moveNumber) {
          case 1:
            player.setFirstMove(move);
            break;
          case 2:
            player.setSecondMove(move);
            break;
          case 3:
            player.setThirdMove(move);
            break;
          case 4:
            player.setFourthMove(move);
            break;
        }

        this.handleActionUpdates(player, (activeTurns) => {
          this.io.to(gameId).emit("updatePlayerActions", {
            playerName,
            turnAmount: activeTurns,
          });
        });
      });

      socket.on(
        "setGuns",
        ({ gameId, playerName, numberedTurn, side, gunData }) => {
          const game = gameHandler.getGame(gameId);

          if (!game) {
            socket.emit(
              "gameError",
              `Game ${gameId} does not exist for setting guns`
            );
            return;
          }

          const player = game.getPlayer(playerName);
          if (!player || !player.getShip()) {
            socket.emit(
              "gameError",
              "Player does not exist in the game or does not have a ship yet"
            );
            return;
          }

          player.moves.setGuns(numberedTurn, side, gunData);

          this.handleActionUpdates(player, (activeTurns) => {
            this.io.to(gameId).emit("updatePlayerActions", {
              playerName,
              turnAmount: activeTurns,
            });
          });
        }
      );

      socket.on("requestShipStats", ({ playerName, gameId }) => {
        const game = gameHandler.getGame(gameId);
        if (!game) {
          return;
        }
        if (
          game.getPlayer(playerName) &&
          game.getPlayer(playerName).getShip()
        ) {
          const { bilge, damage } = game
            .getPlayer(playerName)
            .getShip()
            .getShipStats();
          socket.emit("updateShipStats", { bilge, damage });
        } else {
          socket.emit(
            "gameError",
            `player ${playerName} does not exist or does not yet have a ship`
          );
        }
      });

      socket.on("message", (data) => {
        console.log("message: ", data);
      });
    });
  }

  unregisterEvents() {}
}

module.exports = SocketHandler;
