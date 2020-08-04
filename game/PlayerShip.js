const Orientation = require("./Orientation");
const ShipType = require("./ShipType");
const CannonType = require("./CannonType");

class PlayerShip {
  constructor(id, shipType, side = "ATTACKING") {
    this.shipId = id;
    this.shipType = shipType;
    this.boardX = 0;
    this.boardY = 0;

    this.bilge = 0;
    this.damage = 0;

    this.orientation = Orientation.SOUTH;

    this.sinking = false;
    this.side = side;

    // Will hold the value of the which turn the ship was sunk on, e.g ship was sunk on turn 3.
    this.sunkOnTurn = 0;
  }

  getShipStats() {
    return {
      shipOwner: this.shipId,
      shipType: this.shipType.serverName,
      boardX: this.boardX,
      boardY: this.boardY,

      bilge: this.bilge,
      damage: this.damage / this.shipType.maxDamage, // Returns damage as a percentage instead of the raw value
      dualCannon: this.shipType.dualCannon,
      stallToken: this.shipType.stallToken,
      orientation: this.orientation.name,
    };
  }

  ramRocks() {
    this.damageShip(this.shipType.rockDamage);
  }

  /**
   *
   * @param {PlayerShip} otherShip  The other player ship that is ramming this ship.
   */
  ramShip(otherShip, turn) {
    otherShip.damageShip(this.shipType.ramDamage, turn);
    this.damageShip(otherShip.shipType.ramDamage, turn);
  }

  damageShip(amount, turn) {
    let total = this.damage + amount;

    if (this.total > amount) this.total = amount;

    this.damage = total;

    if (this._checkSink()) {
      this.sinking = true;
      this.sunkOnTurn = turn;
    }
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
