const Move = require("./Move");
const Direction = require("../Direction");
const { isActionableDirection } = require("../util");
class PlayerMoves {
  /**
   *
   * @param {String} shipId
   * @param {Array.<Move>} moves
   */
  constructor(shipId, moves = [null, null, null, null]) {
    this.moveArray = moves;
    this.shipId = shipId;

    this.firstMove = moves[0];
    this.secondMove = moves[1];
    this.thirdMove = moves[2];
    this.fourthMove = moves[3];
  }

  /**
   * Set's the first move of the player move turn
   * @param {Direction} move
   */
  setFirstMove(dir) {
    this.firstMove = new Move(dir, this.shipId);
  }

  /**
   * Set's the second move of the player move turn
   * @param {Direction} move
   */
  setSecondMove(dir) {
    this.secondMove = new Move(dir, this.shipId);
  }

  /**
   * Set's the third move of the player move turn
   * @param {Direction} move
   */
  setThirdMove(dir) {
    this.thirdMove = new Move(dir, this.shipId);
  }

  /**
   * Set's the fourth move of the player move turn
   * @param {Direction} move
   */
  setFourthMove(dir) {
    this.fourthMove = new Move(dir, this.shipId);
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

    incrementOnActiveTurn(this.firstMove);
    incrementOnActiveTurn(this.secondMove);
    incrementOnActiveTurn(this.thirdMove);
    incrementOnActiveTurn(this.fourthMove);

    return count;
  }

  checkAndCreate(turn) {
    if (this[turn]) return;
    this[turn] = new Move(null, this.shipId);
    return this[turn];
  }

  setGuns(turnNumber, side, gunData) {
    let move;
    switch (turnNumber) {
      case 1:
        move = this.checkAndCreate("firstMove");
        break;
      case 2:
        move = this.checkAndCreate("secondMove");
        break;
      case 3:
        move = this.checkAndCreate("thirdMove");
        break;
      case 4:
        move = this.checkAndCreate("fourthMove");
        break;
      default:
        return;
    }
    move[side + "Guns"] = gunData;
  }

  clear() {
    this.firstMove = null;
    this.secondMove = null;
    this.thirdMove = null;
    this.fourthMove = null;
  }

  getShipId() {
    return this.shipId;
  }
}

module.exports = PlayerMoves;
