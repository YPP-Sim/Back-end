const CannonType = require("./CannonType");
module.exports = {
  WAR_FRIG: {
    name: "War Frigate",
    serverName: "WAR_FRIG",
    dualCannon: true,
    maxMoves: 3,
    cannonType: CannonType.LARGE,
    rockDamage: 2.5,
    ramDamage: 3,
    maxDamage: 50,
    influenceDiameter: 8,
    shipSize: 3,
  },
  WAR_BRIG: {
    name: "War Brig",
    serverName: "WAR_BRIG",
    dualCannon: true,
    maxMoves: 3,
    cannonType: CannonType.MEDIUM,
    rockDamage: 1.25,
    ramDamage: 2,
    maxDamage: 25,
    influenceDiameter: 6,
    shipSize: 2,
  },
};
