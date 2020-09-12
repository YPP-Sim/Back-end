const PlayerMoves = require("./moves/PlayerMoves");
const PlayerShip = require("./PlayerShip");
const game = require("./game");
const { findSmallestNumber } = require("./util");
const Direction = require("./Direction");
const MoveGenerator = require("./moves/MoveGenerator");

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

    // Available moves
    this.tokens = {
      LEFT: 2,
      FORWARD: 4,
      RIGHT: 2,
    };

    const onPlayMove = (fromDirection, toDirection, index) => {
      // If we replaced the previous token (fromDirection), add it back to the available tokens
      if (fromDirection) this.tokens[fromDirection] += 1;

      // Subtract one from the available tokens
      this.tokens[toDirection] -= 1;

      // Update client
      this.sendSocketMessage("playMove", { direction: toDirection, index });
      this.updateClientTokens(true, false);
    };

    // Ship hand moves
    this.moves = new PlayerMoves(
      playerName,
      [null, null, null, null],
      onPlayMove
    );

    // Socket to send specific client commands to.
    this.socket = socket;

    // Available cannons
    this.cannons = 0;
    // Cannons currently loaded (e.g. to shoot this turn)
    this.cannonsLoaded = 0;

    this.autoSelectTokenGeneration = true;
    this.selectedToken = Direction.FORWARD;

    this.moveGenerator = new MoveGenerator(this);
  }

  getMoveGenerator() {
    return this.moveGenerator;
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
   * can either use it as updateClientTokens() or optional parameters to update Moves and Cannons
   * like so: updateClientTokens(true, false) would update moves but not include cannons
   * @param updateMoves includes move tokens in the update
   * @param updateCannons includes cannon tokens in the update
   */
  updateClientTokens(updateMoves = true, updateCannons = true) {
    const updateObj = {};
    if (updateMoves) updateObj.moves = this.tokens;
    if (updateCannons) updateObj.cannons = this.cannons;

    this.sendSocketMessage("updateTokens", updateObj);
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
    this.moves.move1 = move;
  }

  setSecondMove(move) {
    this.moves.move2 = move;
  }

  setThirdMove(move) {
    this.moves.move3 = move;
  }

  setFourthMove(move) {
    this.moves.move4 = move;
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
