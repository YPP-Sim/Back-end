const PlayerShip = require("../game/PlayerShip");
const ShipType = require("../game/ShipType");
const Game = require("../game/game");
const JobberQuality = require("../game/JobberQuality");

const testMap = [
  [1, 0, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 7, 8],
  [0, 1, 1, 2, 3, 4, 0, 0, 0, 15, 0, 15, 0, 0, 0, 0, 0, 0, 6, 5],
  [0, 0, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 15, 15, 0, 11, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 0, 14, 0, 10, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 7, 8, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 6, 5, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 0, 0, 0, 4, 4, 4, 4, 4, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0],
];

function mockEmit(eventName, eventData) {
  if (logMockEmits)
    console.log(
      `Event ${eventName} emitted with data: ${util.inspect(
        eventData,
        false,
        null,
        true
      )}`
    );
  return eventData;
}

const jestEmitMock = jest.fn(mockEmit);

const ioMock = {
  emit: jestEmitMock,
  to: () => {
    return {
      emit: jestEmitMock,
    };
  },
  in: () => {
    return {
      emit: jestEmitMock,
    };
  },
};

describe("ship functions", () => {
  let testShip;
  let testGame;
  beforeEach(() => {
    testGame = new Game(
      testMap,
      JobberQuality.ELITE,
      "testGameId",
      ioMock,
      "testMap",
      6,
      false,
      "",
      "testPlayer"
    );
    testShip = new PlayerShip(
      "testShip",
      ShipType.WAR_FRIG,
      "ATTACKER",
      testGame
    );
    testShip.boardX = 5;
    testShip.boardY = 7;
  });

  it("ramRocks", () => {
    testShip.ramRocks();
    expect(testShip.isInSafeZone()).toBe(false);
    expect(testShip.damage).toEqual(testShip.shipType.rockDamage);
  });

  it("ramShip", () => {
    const otherShip = new PlayerShip(
      "otherShip",
      ShipType.WAR_FRIG,
      "DEFENDER",
      testGame
    );
    otherShip.boardX = 6;
    otherShip.boardY = 7;

    expect(testShip.isInSafeZone()).toBe(false);
    expect(otherShip.isInSafeZone()).toBe(false);

    testGame.setShipPosition(otherShip.shipId, 6, 7);
    testShip.ramShip(otherShip);

    expect(testShip.damage).toBe(otherShip.shipType.ramDamage);
    expect(otherShip.damage).toBe(testShip.shipType.ramDamage);
  });

  it("sinks when taking max damage", () => {
    testShip.damageShip(70);
    expect(testShip.sinking).toBe(true);
  });
});
