class PlayerData {
  constructor(playerName, ship = null) {
    this.playerName = playerName;
    this.ship = ship;
  }

  getName() {
    return this.playerName;
  }

  getShip() {
    return this.ship;
  }
}

module.exports = PlayerData;
