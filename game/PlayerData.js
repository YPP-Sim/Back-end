const PlayerMoves = require("./moves/PlayerMoves");
const PlayerShip = require("./PlayerShip");
const game = require("./game");
const { findSmallestNumber } = require("./util");
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
      LEFT: 2,
      FORWARD: 4,
      RIGHT: 2,
    };

    // Available cannons
    this.cannons = 0;
    // Cannons currently loaded (e.g. to shoot this turn)
    this.cannonsLoaded = 0;

    this.autoSelectTokenGeneration = true;
    this.selectedToken = Direction.FORWARD;
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

  /**
   * Sends server's data to the client on movement and cannon tokens
   */
  updateClientTokens() {
    this.sendSocketMessage("updateTokens", {
      moves: this.tokens,
      cannons: this.cannons,
    });
  }

  /**
   * Sends data to the client with the current selected token
   */
  updateClientSelectedToken() {
    this.sendSocketMessage("updateSelectedToken", this.selectedToken);
  }

  generateMove() {
    // Possible edge case scenario
    if (this.selectedToken === Direction.STALL) {
      this.selectedToken = Direction.FORWARD;
      console.error(
        `Selected Token for player ${this.playerName} was set to STALL, setting to FORWARD for now but fix if this message pops up.`
      );
    }

    this.tokens[this.selectedToken] += 1;

    if (this.autoSelectTokenGeneration) {
      // Find the token name with the smallest amount of tokens and set it as the selected token
      this.selectedToken = findSmallestNumber(this.tokens);
      // Update selected token to client
      this.updateClientSelectedToken();
    }
  }

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
