const PlayerMoves = require("./moves/PlayerMoves");
const PlayerShip = require("./PlayerShip");
const game = require("./game");
const Direction = require("./Direction");

class PlayerData {
  /**
   *
   * @param {string} playerName
   * @param {*} socket
   * @param {game} game
   * @param {*} ship
   */
  constructor(playerName, socket, game, ship = null) {
    this.playerName = playerName;
    this.ship = ship;
    this.game = game;
    // Ship hand moves
    this.moves = new PlayerMoves(playerName);

    // Socket to send specific client commands to.
    this.socket = socket;

    // Available moves
    this.tokens = {
      left: 2,
      forward: 4,
      right: 2,
    };

    // Available cannons
    this.cannons = 0;
    // Cannons currently loaded (e.g. to shoot this turn)
    this.cannonsLoaded = 0;

    this.autoSelectTokenGeneration = true;
    this.selectedTokenGeneration = Direction.FORWARD;
  }

  sendSocketMessage(eventName, eventObj) {
    if (!this.socket) {
      console.error(
        "Error, could not send socket message: " +
          eventName +
          ", as socket is either null or not defined"
      );
      return;
    }

    this.socket.emit(eventName, eventObj);
  }

  updateClientTokens() {
    this.sendSocketMessage("updateTokens", {
      moves: this.tokens,
      cannons: this.cannons,
    });
  }

  generateMove() {}

  addCannons(amount) {
    if (
      this.cannons + this.cannonsLoaded + amount >
      this.getShip().shipType.maxCannnons
    )
      this.cannons = this.getShip().shipType.maxCannnons - this.cannonsLoaded;
    else this.cannons += amount;
  }

  startMovementGeneration() {}

  getTokens() {
    return this.tokens;
  }

  getCannons() {
    return this.cannons;
  }

  getCannonsLoaded() {
    return this.cannonsLoaded;
  }

  getMoves() {
    return this.moves;
  }

  // Same is moves.set#####(move)
  // Just some more helpful sugar coating
  setFirstMove(move) {
    this.moves.firstMove = move;
  }

  setSecondMove(move) {
    this.moves.secondMove = move;
  }

  setThirdMove(move) {
    this.moves.thirdMove = move;
  }

  setFourthMove(move) {
    this.moves.fourthMove = move;
  }

  getSide(game) {
    let side;
    if (game.isDefender(this.getName())) side = "DEFENDER";
    else if (game.isAttacker(this.getName())) side = "ATTACKER";
    else side = "UNDECIDED";

    return side;
  }

  getName() {
    return this.playerName;
  }

  /**
   * @returns {PlayerShip}
   */
  getShip() {
    return this.ship;
  }
}

module.exports = PlayerData;
