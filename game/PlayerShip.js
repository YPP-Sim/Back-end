const Orientation = require("./Orientation");
const ShipType = require("./ShipType");

class PlayerShip {
  constructor(id, shipType) {
    this.shipId = id;
    this.shipType = shipType;
    this.boardX = 0;
    this.boardY = 0;

    this.bilge = 0;
    this.damage = 0;

    this.orientation = Orientation.SOUTH;

    this.sinking = false;

    // TODO: Maybe a sunk boolean variable?
  }

  ramRocks() {
    this.damageShip(this.shipType.rockDamage);
  }

  /**
   *
   * @param {PlayerShip} otherShip  The other player ship that is ramming this ship.
   */
  ramShip(otherShip) {
    otherShip.damageShip(this.shipType.ramDamage);
    this.damageShip(otherShip.shipType.ramDamage);
  }

  damageShip(amount) {
    let total = this.damage + amount;

    if (this.total > amount) this.total = amount;

    this.damage = total;

    if (this._checkSink()) this.sinking = true;
  }

  _checkSink() {
    return this.damage >= this.shipType.maxDamage;
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
  setOrientation(orient) {
    this.orientation = orient;
  }
}

module.exports = PlayerShip;
