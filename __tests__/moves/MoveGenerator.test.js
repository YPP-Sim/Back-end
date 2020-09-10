const MoveGenerator = require("../../game/moves/MoveGenerator");
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

describe("token generation", () => {
  let playerData;
  let moveGenerator;

  beforeEach(() => {
    const pShip = new PlayerShip(
      "testPlayer",
      ShipType.WAR_FRIG,
      "ATTACKER",
      dummyGame
    );
    playerData = new PlayerData("testPlayer", testSocket, dummyGame, pShip);
    moveGenerator = new MoveGenerator(playerData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("generates movement and cannon tokens", () => {
    const updateCount = 30;

    expect(playerData.tokens.FORWARD).toBe(4);
    expect(playerData.tokens.LEFT).toBe(2);
    for (let i = 0; i < updateCount; i++) moveGenerator.update();
    expect(playerData.tokens.FORWARD).toBe(5);
    expect(playerData.tokens.LEFT).toBe(3);
    expect(playerData.getCannons()).toBe(14);
  });

  it("sends updates to client", () => {
    const updateCount = 3;
    for (let i = 0; i < updateCount; i++) moveGenerator.update();

    expect(jestEmitMock.mock.calls[0][0]).toBe("updateTokens");
    const eventData = jestEmitMock.mock.calls[0][1];
    expect(eventData.cannons).toBe(1);
  });
});
