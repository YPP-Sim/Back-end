const gameHandler = require("./games-handler");
const PlayerShip = require("./game/PlayerShip");
const GameStatus = require("./game/GameStatus");
const ShipType = require("./game/ShipType");
const jwt = require("jsonwebtoken");
const util = require("./game/util");
const Move = require("./game/moves/Move");
const Direction = require("./game/Direction");
const { move } = require("./routes/maps-router");

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

  gameData.flags = game.flags;

  return gameData;
}

function validateGameAndPlayer(gameId, playerName, socket) {
  const game = gameHandler.getGame(gameId);

  if (!game) {
    socket.emit("gameError", `Game ${gameId} does not exist`);
    return { failed: true };
  }

  const player = game.getPlayer(playerName);
  if (!player || !player.getShip()) {
    socket.emit(
      "gameError",
      "Player does not exist in the game or does not have a ship yet"
    );
    return { failed: true };
  }

  return { game, player, failed: false };
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
    this.actionAmountCache[player.playerName] = activeTurns;
  }

  registerEvents() {
    this.io.on("connection", (socket) => {
      socket.on("joinGame", async ({ gameId, playerName, token }) => {
        // Verify the token the player is sending
        if (typeof token === "undefined" || token === null) {
          socket.emit("gameError", `Missing token for validity of player`);
          return;
        }

        let decoded;
        try {
          decoded = await util.verifyToken(token);
        } catch (err) {
          console.log(
            `Error trying to verify user token. GameID: ${gameId}, playerName: ${playerName}, reason: `,
            err
          );
        }

        if (decoded.gameId !== gameId || decoded.playerName !== playerName) {
          socket.emit(
            "gameError",
            `token is validated but does not match the game being joined`
          );
          return;
        }

        // Pair the socket with a player
        this.playerSockets[socket.id] = { playerName, gameId };
        const game = gameHandler.getGame(gameId);
        if (!game) {
          socket.emit("gameError", `Game '${gameId}' does not exist!`);
          return;
        }

        game.addPlayer(playerName, socket);

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
            game.addAttacker(playerName, socket);

            break;
          case "DEFENDER":
            if (game.isAttacker(playerName)) game.removeAttacker(playerName);
            game.addDefender(playerName, socket);
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
          socket.emit("gameError", `Game ${gameId} does not exist`);
          return;
        }

        const player = game.getPlayer(playerName);

        const side = player.getSide(game);
        if (!player.ship) {
          const ship = new PlayerShip(
            playerName,
            ShipType[shipType],
            side,
            game
          );
          player.setShip(ship);
        } else {
          player.ship.shipType = ShipType[shipType];
          player.getMoves().setStallToken(player.ship.shipType.stallToken);
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
        const { player, failed } = validateGameAndPlayer(
          gameId,
          playerName,
          socket
        );
        if (failed) return;

        const { moveNumber, direction, leftGuns, rightGuns } = moveData;
        const playerMoves = player.getMoves();

        if (leftGuns) playerMoves.setGuns(moveNumber, "left", leftGuns);
        if (rightGuns) playerMoves.setGuns(moveNumber, "right", rightGuns);

        playerMoves.setMove(direction, moveNumber);

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
          const { player, failed } = validateGameAndPlayer(
            gameId,
            playerName,
            socket
          );
          if (failed) return;
          player.moves.setGuns(numberedTurn, side, gunData);
          this.handleActionUpdates(player, (activeTurns) => {
            this.io.to(gameId).emit("updatePlayerActions", {
              playerName,
              turnAmount: activeTurns,
            });
          });
        }
      );

      socket.on("autoSelectUpdate", ({ gameId, playerName, autoBool }) => {
        const { player, failed } = validateGameAndPlayer(
          gameId,
          playerName,
          socket
        );
        if (failed) return;
        player.setAutoSelectTokenGeneration(autoBool);
      });

      socket.on(
        "updateSelectedToken",
        ({ gameId, playerName, selectedToken }) => {
          const { player, failed } = validateGameAndPlayer(
            gameId,
            playerName,
            socket
          );
          if (failed) return;

          player.setSelectedToken(selectedToken);
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
          const ship = game.getPlayer(playerName).getShip();
          const damage = ship.getDamagePercentage();
          const bilge = ship.getBilgePercentage();
          socket.emit("updateShipStats", { bilge, damage });
        } else {
          socket.emit(
            "gameError",
            `player ${playerName} does not exist or does not yet have a ship`
          );
        }
      });

      socket.on("requestShipMoves", ({ playerName, gameId }) => {
        const game = gameHandler.getGame(gameId);
        if (!game) return;
        const player = game.getPlayer(playerName);
        if (player && player.getShip()) player.updateShipMoves();
        else {
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
