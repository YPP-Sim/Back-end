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

    // If this move puts the ship on a wind cell, this data will change and help handle the interaction
    this.windTypeMovement = null;

    // This is data to be sent to the client to determine how far the cannonball should travel in terms of squares.
    // If cannon hits a ship early, the data here will change for this specific move.
    this.leftGunEnd = 3;
    this.rightGunEnd = 3;
    this.rightHit = false;
    this.leftHit = false;
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
