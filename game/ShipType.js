const CannonType = require("./CannonType");
module.exports = {
  WAR_FRIG: {
    name: "War Frigate",
    dualCannon: true,
    maxMoves: 3,
    cannonType: CannonType.LARGE,
    rockDamage: 1.667,
    ramDamage: 2,
    maxDamage: 33.32,
    influenceDiameter: 8,
    shipSize: 3,
  },
  WAR_BRIG: {
    name: "War Brig",
    dualCannon: true,
    maxMoves: 3,
    cannonType: CannonType.MEDIUM,
    rockDamage: 0.833,
    ramDamage: 1.333,
    maxDamage: 16.66,
    influenceDiameter: 6,
    shipSize: 2,
  },
};
