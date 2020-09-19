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

describe("damage repair generation", () => {
  let playerData;
  let repairGenerator;

  beforeEach(() => {
    const pShip = new PlayerShip(
      "testPlayer",
      ShipType.WAR_FRIG,
      "ATTACKER",
      dummyGame
    );
    playerData = new PlayerData("testPlayer", testSocket, dummyGame, pShip);
    repairGenerator = playerData.getRepairGenerator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("appropriately repairs ship if damaged", () => {
    playerData.getShip().damageShip(25, 1);
    expect(playerData.getShip().damage).toBe(25);
    repairGenerator.update();
    expect(playerData.getShip().damage).toBeLessThan(25);
  });
});
