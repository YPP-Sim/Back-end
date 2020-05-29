const PlayerShip = require("../game/PlayerShip");
const ShipType = require("../game/ShipType");
const Orientation = require("../game/Orientation");

let testShip;
describe("ship functions", () => {
  beforeEach(() => {
    testShip = new PlayerShip("testShip", ShipType.WAR_FRIG);
  });

  it("ramRocks", () => {
    testShip.ramRocks();
    expect(testShip.damage).toEqual(testShip.shipType.rockDamage);
  });

  it("ramShip", () => {
    const otherShip = new PlayerShip("otherShip", ShipType.WAR_FRIG);
    testShip.ramShip(otherShip);

    expect(testShip.damage).toBe(otherShip.shipType.ramDamage);
    expect(otherShip.damage).toBe(testShip.shipType.ramDamage);
  });

  it("sinks when taking max damage", () => {
    testShip.damageShip(70);
    expect(testShip.sinking).toBe(true);
  });
});
