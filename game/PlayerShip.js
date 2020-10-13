const Orientation = require("./Orientation");
const ShipType = require("./ShipType");
const CannonType = require("./CannonType");

class PlayerShip {
  constructor(id, shipType, side = "ATTACKING", game) {
    this.shipId = id;
    this.shipType = shipType;
    this.boardX = 0;
    this.boardY = 0;

    this.game = game;
    this.bilge = 0;
    this.damage = 0;

    this.orientation = Orientation.SOUTH;

    this.sinking = false;
    this.side = side;

    // Will hold the value of the which turn the ship was sunk on, e.g ship was sunk on 3rd move.
    this.sunkOnTurn = 0;
  }

  setPosition(x, y) {
    this.game.setShipPosition(this.shipId, x, y);
  }

  getShipStats() {
    return {
      shipOwner: this.shipId,
      shipType: this.shipType.serverName,
      boardX: this.boardX,
      boardY: this.boardY,
      sunkOnTurn: this.sunkOnTurn,
      bilge: this.bilge,
      damage: this.getDamagePercentage(), // Returns damage as a percentage instead of the numerical max damage
      dualCannon: this.shipType.dualCannon,
      stallToken: this.shipType.stallToken,
      orientation: this.orientation.name,
    };
  }

  getBilgePercentage() {
    return this.bilge / 100;
  }

  getDamagePercentage() {
    return this.damage / this.shipType.maxDamage;
  }

  ramRocks(turn) {
    this.damageShip(this.shipType.rockDamage, turn);
  }

  addBilge(amount) {
    if (amount + this.bilge > 100) this.bilge = 100;
    else if (amount + this.bilge < 0) this.bilge = 0;
    else this.bilge += amount;
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
    if (this.sinking) return;
    if (this.isInSafeZone()) return;

    let total = this.damage + amount;

    if (this.total > amount) this.total = amount;

    this.damage = total;

    if (this._checkSink()) {
      this.sinking = true;
      this.sunkOnTurn = turn;
    }
  }

  repairShip(amount) {
    this.damage -= amount;
    if (this.damage < 0) this.damage = 0;
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

  isInSafeZone() {
    return this.game.getCell(this.boardX, this.boardY).cell_id === -1;
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
