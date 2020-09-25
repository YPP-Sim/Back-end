const Move = require("./Move");
const Direction = require("../Direction");
const { isActionableDirection } = require("../util");
class PlayerMoves {
  /**
   *
   * @param {String} shipId
   * @param {Array.<Move>} moves
   */
  constructor(
    shipId,
    moves = [null, null, null, null],
    onPlayMove,
    playerData,
    stallToken = true
  ) {
    this.moveArray = moves;
    this.shipId = shipId;

    this.stallToken = stallToken;

    this.move1 = moves[0];
    this.move2 = moves[1];
    this.move3 = moves[2];
    this.move4 = stallToken ? new Move(Direction.STALL, shipId) : moves[3];
    this.playerData = playerData;
    this.onPlayMove = onPlayMove;
  }

  setMove(dir, index) {
    // Save previous direction
    const prevMove = this["move" + index];
    let prevDir = null;
    if (prevMove) prevDir = prevMove.getDirection();

    // Update data on server
    if (!this["move" + index])
      this["move" + index] = new Move(dir, this.shipId);
    else this["move" + index].setDirection(dir);

    // Execute callback for sending client updates.
    if (typeof this.onPlayMove === "function")
      this.onPlayMove(prevDir, dir, index);
    return prevDir;
  }

  /**
   * Set's the first move of the player move turn
   * @param {Direction} move
   * @returns The previous move direction that dir had overriden
   */
  setFirstMove(dir) {
    return this.setMove(dir, 1);
  }

  /**
   * Set's the second move of the player move turn
   * @param {Direction} move
   * @returns The previous move direction that dir had overriden
   */
  setSecondMove(dir) {
    return this.setMove(dir, 2);
  }

  /**
   * Set's the third move of the player move turn
   * @param {Direction} move
   * @returns The previous move direction that dir had overriden
   */
  setThirdMove(dir) {
    return this.setMove(dir, 3);
  }

  /**
   * Set's the fourth move of the player move turn
   * @param {Direction} move
   * @returns The previous move direction that dir had overriden
   */
  setFourthMove(dir) {
    return this.setMove(dir, 4);
  }

  getActiveTurnAmount() {
    let count = 0;

    function incrementOnActiveTurn(move) {
      if (move) {
        if (
          !isActionableDirection(move.direction) &&
          move.leftGuns[0] === false &&
          move.rightGuns[0] === false
        )
          return;

        count++;
      }
    }

    incrementOnActiveTurn(this.move1);
    incrementOnActiveTurn(this.move2);
    incrementOnActiveTurn(this.move3);
    incrementOnActiveTurn(this.move4);

    return count;
  }

  checkAndCreate(turn) {
    if (this[turn]) return this[turn];
    this[turn] = new Move(null, this.shipId);
    return this[turn];
  }

  setGuns(turnNumber, side, gunData) {
    let move;
    switch (turnNumber) {
      case 1:
        move = this.checkAndCreate("move1");
        break;
      case 2:
        move = this.checkAndCreate("move2");
        break;
      case 3:
        move = this.checkAndCreate("move3");
        break;
      case 4:
        move = this.checkAndCreate("move4");
        break;
      default:
        return;
    }
    side = side.toLowerCase();

    const prevGuns = move[side + "Guns"];

    let prevGunsAmount = 0;
    let currentGunsAmount = 0;

    for (let gun of prevGuns) if (gun) prevGunsAmount++;
    for (let gun of gunData) if (gun) currentGunsAmount++;
    const deltaGuns = currentGunsAmount - prevGunsAmount;

    // For old tests
    if (!this.playerData) {
      move[side + "Guns"] = gunData;
      return;
    }

    const oppositeDelta = deltaGuns * -1;

    if (this.playerData.getCannons() + oppositeDelta >= 0) {
      move[side + "Guns"] = gunData;

      this.playerData.addCannons(oppositeDelta);
      this.playerData.addCannonsLoaded(deltaGuns);

      this.playerData.updateClientTokens(false, true);
    }
  }

  setStallToken(bool) {
    this.stallToken = bool;
  }

  _clearCheckStall(moveIndex) {
    if (
      this["move" + moveIndex] &&
      this["move" + moveIndex].direction === Direction.STALL
    )
      return new Move(Direction.STALL, this.shipId);
    else return null;
  }

  clear() {
    this.move1 = this._clearCheckStall(1);
    this.move2 = this._clearCheckStall(2);
    this.move3 = this._clearCheckStall(3);
    this.move4 = this._clearCheckStall(4);
    if (this.playerData) this.playerData.cannonsLoaded = 0;
  }

  getShipId() {
    return this.shipId;
  }
}

module.exports = PlayerMoves;
