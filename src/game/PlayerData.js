const PlayerMoves = require("./moves/PlayerMoves");
const PlayerShip = require("./PlayerShip");
const game = require("./game");
const { findSmallestToken } = require("./util");
const Direction = require("./Direction");
const MoveGenerator = require("./moves/MoveGenerator");
const BilgeGenerator = require("./generation/BilgeGenerator");
const RepairGenerator = require("./generation/RepairGenerator");

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
      FORWARD: {
        amount: 4,
        dustTimes: [5, 5, 5, 5],
      },
      LEFT: {
        amount: 2,
        dustTimes: [5, 5],
      },
      RIGHT: {
        amount: 2,
        dustTimes: [5, 5],
      },
    };

    const onPlayMove = (fromDirection, toDirection, index) => {
      // If we replaced the previous token (fromDirection), add it
      if (fromDirection && fromDirection !== "STALL")
        this.tokens[fromDirection].amount += 1;

      // Subtract one from the available tokens
      if (this.tokens[toDirection]) this.tokens[toDirection].amount -= 1;

      // Update client
      this.sendSocketMessage("playMove", { direction: toDirection, index });
      this.updateClientTokens(true, false);
    };

    // Ship hand moves
    this.moves = new PlayerMoves(
      playerName,
      [null, null, null, null],
      onPlayMove,
      this,
      false
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
    this.bilgeGenerator = new BilgeGenerator(this);
    this.repairGenerator = new RepairGenerator(this);
  }

  setShip(ship) {
    this.ship = ship;
    this.getMoves().setStallToken(ship.shipType.stallToken);
  }

  getMoveGenerator() {
    return this.moveGenerator;
  }

  getBilgeGenerator() {
    return this.bilgeGenerator;
  }

  getRepairGenerator() {
    return this.repairGenerator;
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
   * The player will simulate a side swap/reposition if they are in the safezone.
   */
  disengage() {
    if (this.ship && this.ship.isInSafeZone()) {
      // Spawn ocean-side (attacker side)
      this.game.setRandomSpawn(this.ship, true);
      const eventObj = {
        shipId: this.playerName,
        boardX: this.ship.boardX,
        boardY: this.ship.boardY,
        orientation: this.ship.getOrientation().name,
      };

      this.game.sendPacket("shipPositionChange", eventObj);
    }
  }

  updateShipStats(updateDamage = true, updateBilge = true) {
    const eventObj = {};
    if (updateBilge) eventObj.bilge = this.getShip().getBilgePercentage();
    if (updateDamage) eventObj.damage = this.getShip().getDamagePercentage();

    this.sendSocketMessage("updateShipStats", eventObj);
  }

  updateShipMoves() {
    for (let i = 1; i <= 4; i++) {
      const move = this.getMoves()["move" + i];
      let direction = null;
      if (move) direction = move.direction;

      this.sendSocketMessage("playMove", { index: i, direction });
    }
  }

  setAutoSelectTokenGeneration(autoSelect = true) {
    this.autoSelectTokenGeneration = autoSelect;
    // Send confirmation packet
    this.sendSocketMessage("updateAutoSelect", this.autoSelectTokenGeneration);

    if (this.autoSelectTokenGeneration) {
      // set new selected token now that auto has kicked in.
      const toSelectedToken = findSmallestToken(this.tokens);
      this.setSelectedToken(toSelectedToken);
    }
  }

  setSelectedToken(selectedToken) {
    this.selectedToken = selectedToken;
    this.sendSocketMessage("updateSelectedToken", this.selectedToken);
  }

  removeMoveDust(direction) {
    if (!direction) return;
    if (
      direction !== Direction.FORWARD &&
      direction !== Direction.LEFT &&
      direction !== Direction.RIGHT
    )
      return;

    const token = this.getTokens()[direction];
    token.dustTimes.shift();
  }

  /**
   * Decrements all of the dust times for all tokens.
   * Will also update client tokens if ANY token had dusted.
   */
  decrementDustTimes() {
    let changed = false;
    for (let tokenName in this.getTokens()) {
      const token = this.getTokens()[tokenName];
      for (let i = 0; i < token.dustTimes.length; i++) {
        let dustTime = token.dustTimes[i];
        dustTime -= 1;

        if (dustTime <= 0) {
          if (token.amount > 0) token.amount -= 1;
          changed = true;
        }

        token.dustTimes[i] = dustTime;
      }

      // Remove the dust time references
      while (token.dustTimes.includes(0)) {
        token.dustTimes.shift();
      }
    }

    if (changed) this.updateClientTokens(true, false);
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
    if (this.cannons <= 0) updateObj.cannons = -1; // Problem with socket io, sending a regular zero will send a 1 instead (don't know why) so sending -1 as a representation for 0.

    this.sendSocketMessage("updateTokens", updateObj);
  }

  generateMove() {
    // Possible edge case scenario
    if (this.selectedToken === Direction.STALL) {
      this.selectedToken = Direction.FORWARD;
      console.error(
        `Selected Token for player ${this.playerName} was set to STALL, setting to FORWARD for now but fix if this message pops up.`
      );
    }

    const token = this.tokens[this.selectedToken];
    token.amount += 1;
    token.dustTimes.push(5);

    if (this.autoSelectTokenGeneration) {
      // Find the token name with the smallest amount of tokens and set it as the selected token
      const toSelectedToken = findSmallestToken(this.tokens);
      // Update selected token to client
      this.setSelectedToken(toSelectedToken);
    }
  }

  addCannons(amount) {
    if (
      this.cannons + this.cannonsLoaded + amount >
      this.getShip().shipType.maxCannnons
    )
      this.cannons = this.getShip().shipType.maxCannnons - this.cannonsLoaded;
    else if (this.cannons + amount < 0) this.cannons = 0;
    else this.cannons += amount;
  }

  addCannonsLoaded(amount) {
    this.cannonsLoaded += amount;
  }

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
