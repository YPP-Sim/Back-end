const Move = require("./Move");

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
   * @param {Move} move
   */
  setFirstMove(move) {
    this.firstMove = move;
  }

  /**
   * Set's the second move of the player move turn
   * @param {Move} move
   */
  setSecondMove(move) {
    this.secondMove = move;
  }

  /**
   * Set's the third move of the player move turn
   * @param {Move} move
   */
  setTirstMove(move) {
    this.thirdMove = move;
  }

  /**
   * Set's the fourth move of the player move turn
   * @param {Move} move
   */
  setFourthtMove(move) {
    this.fourthMove = move;
  }

  getShipId() {
    return this.shipId;
  }
}

module.exports = PlayerMoves;
