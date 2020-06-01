const Move = require("./Move");
const Direction = require("../Direction");
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

  getShipId() {
    return this.shipId;
  }
}

module.exports = PlayerMoves;
