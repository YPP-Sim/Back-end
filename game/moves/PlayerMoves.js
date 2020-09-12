const Move = require("./Move");
const Direction = require("../Direction");
const { isActionableDirection } = require("../util");
class PlayerMoves {
  /**
   *
   * @param {String} shipId
   * @param {Array.<Move>} moves
   */
  constructor(shipId, moves = [null, null, null, null], onPlayMove) {
    this.moveArray = moves;
    this.shipId = shipId;

    this.move1 = moves[0];
    this.move2 = moves[1];
    this.move3 = moves[2];
    this.move4 = moves[3];

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
    move[side + "Guns"] = gunData;
  }

  clear() {
    this.move1 = null;
    this.move2 = null;
    this.move3 = null;
    this.move4 = null;
  }

  getShipId() {
    return this.shipId;
  }
}

module.exports = PlayerMoves;
