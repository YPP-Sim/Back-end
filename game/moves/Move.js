const Direction = require("../Direction");

class Move {
  /**
   *
   * @param {Direction} direction
   */
  constructor(direction, shipId) {
    this.direction = direction;
    this.leftGuns = [false, false];
    this.rightGuns = [false, false];

    this.claimedCells = [];
    this.moveOwner = shipId;

    this.cancelledMovement = false;
    this.cancelledTurnal = false;
  }

  getDirection() {
    return this.direction;
  }

  /**
   *    set's if the move will be shooting guns on the right side.
   *    Example input: [true,false], means that it's a single shot on the right side.
   *    [true, true] = double shot on right side.
   * @param {Array.<Boolean>} gunData
   */
  setRightGuns(gunData) {
    this.rightGuns = gunData;
  }

  /**
   *    set's if the move will be shooting guns on the left side.
   *    Example input: [true,false], means that it's a single shot on the left side.
   *    [true, true] = double shot on left side.
   * @param {Array.<Boolean>} gunData
   */
  setLeftGuns(gunData) {
    this.leftGuns = gunData;
  }
}

module.exports = Move;
