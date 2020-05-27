const Orientation = require("./Orientation");

class PlayerShip {
  constructor(id, shipType) {
    this.shipId = id;
    this.shipType = shipType;
    this.boardX = 0;
    this.boardY = 0;

    this.bilge = 0;
    this.damage = 0;

    this.orientation = Orientation.SOUTH;
  }

  /**
   *
   * @returns the orientation the ship is facing
   */
  getOrientation() {
    return this.orientation;
  }

  /**
   *
   * @param {Orientation} orientation
   */
  setOrientation(orientation) {
    this.orientation = orientation;
  }
}

module.exports = PlayerShip;
