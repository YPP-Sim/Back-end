const TURN_TIME = 35; // Normal turn time, keep to 35 even if to change turn time in future

class RepairGenerator {
  constructor(playerData) {
    this.playerData = playerData;
  }

  update() {
    const ship = this.playerData.getShip();
    const jobberQuality = this.playerData.game.jobberQuality;
    if (ship.getDamagePercentage() > 0) {
      const rate = jobberQuality.fixRate / TURN_TIME;
      ship.repairShip(rate);
      this.playerData.updateShipStats(true, false);
    }
  }
}

module.exports = RepairGenerator;
