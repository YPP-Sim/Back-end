const PlayerData = require("../../game/PlayerData");
const PlayerShip = require("../../game/PlayerShip");
const JobberQuality = require("../../game/JobberQuality");
const ShipType = require("../../game/ShipType");
const util = require("util");

let logMockEmits = false;

const dummyGame = {
  turnTime: 35,
  jobberQuality: JobberQuality.ELITE,
};

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

const testSocket = {
  emit: jestEmitMock,
};

describe("bilge generation", () => {
  let playerData;
  let bilgeGenerator;

  beforeEach(() => {
    const pShip = new PlayerShip(
      "testPlayer",
      ShipType.WAR_FRIG,
      "ATTACKER",
      dummyGame
    );
    playerData = new PlayerData("testPlayer", testSocket, dummyGame, pShip);
    bilgeGenerator = playerData.getBilgeGenerator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("does NOT generate bilge when min damage IS NOT met", () => {
    expect(playerData.getShip().getBilgePercentage()).toBe(0);
    bilgeGenerator.update();
    expect(playerData.getShip().getBilgePercentage()).toBe(0);
  });

  it("generates bilge when min damage IS met", () => {
    expect(playerData.getShip().getBilgePercentage()).toBe(0);
    expect(playerData.getShip().damageShip(26, 1));
    const updateCount = 35;
    for (let i = 0; i < updateCount; i++) bilgeGenerator.update();

    expect(playerData.getShip().getBilgePercentage()).toBeGreaterThan(0);
  });
});
