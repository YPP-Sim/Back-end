class PlayerData {
  constructor(playerName, ship = null) {
    this.playerName = playerName;
    this.ship = ship;
  }

  getSide(game) {
    let side;
    if (game.isDefender(this.getName())) {
      side = "DEFENDER";
    } else if (game.isAttacker(this.getName())) {
      side = "ATTACKER";
    } else {
      side = "UNDECIDED";
    }

    return side;
  }

  getName() {
    return this.playerName;
  }

  getShip() {
    return this.ship;
  }
}

module.exports = PlayerData;
