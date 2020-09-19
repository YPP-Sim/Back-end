const BILGE_INCREASE_RATE_PER_TICK = 1;
const TURN_TIME = 35; // Eventually take from regular game turn time?

class BilgeGenerator {
  constructor(playerData) {
    this.playerData = playerData;
  }

  update() {
    const jobberQuality = this.playerData.game.jobberQuality;
    const ship = this.playerData.getShip();
    let update = false;

    if (!ship) return;

    if (
      ship.getDamagePercentage() * 100 >=
      jobberQuality.minDamageForBilgePercent
    ) {
      const shipDmg = ship.getDamagePercentage();
      const bilge = BILGE_INCREASE_RATE_PER_TICK + shipDmg / 10;
      ship.addBilge(bilge);
      update = true;
    }

    if (ship.getBilgePercentage() > 0) {
      const rate =
        jobberQuality.bilgeFixRate / TURN_TIME -
        ship.getDamagePercentage() / 10000;
      ship.addBilge(rate * -1);
      update = true;
    }

    if (update) this.playerData.updateShipStats(false, true);
  }
}

module.exports = BilgeGenerator;
