const Game = require("../game/game");
const ShipType = require("../game/ShipType");
const Direction = require("../game/Direction");
const Orientation = require("../game/Orientation");
const Move = require("../game/moves/Move");
const PlayerMoves = require("../game/moves/PlayerMoves");
const JobberQuality = require("../game/JobberQuality");
const util = require("util");

// Will console log out all the io events and data that would be sent by the server
// during testing
let logMockEmits = false;

const testMap = [
  [1, 0, 1, 0, 0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 15, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0],
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
  in: () => {
    return {
      emit: jestEmitMock,
    };
  },
};

let testGame;
describe("Game", () => {
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
  });

  describe("common functions", () => {
    it("adds ship", () => {
      testGame.addShip("testShip", ShipType.WAR_FRIG, 1, 2, "DEFENDER");
      expect(testGame.defenders["testShip"]).not.toBe(undefined);
      expect(testGame.getCell(1, 2).occupiedBy).toEqual("testShip");
      expect(testGame.getCell(1, 2).cell_id).toEqual(-1); // This is technically safe zone
    });

    it("gets ship by id", () => {
      testGame.addShip("testShip", ShipType.WAR_FRIG, 1, 2, "DEFENDER");
      const ship = testGame.getShipById("testShip");
      expect(ship).not.toBe(undefined);
    });

    it("isOutOfBounds", () => {
      expect(testGame.isOutOfBounds(20, 9)).toBe(true);
      expect(testGame.isOutOfBounds(-1, 0)).toBe(true);
      expect(testGame.isOutOfBounds(0, -1)).toBe(true);
      expect(testGame.isOutOfBounds(21, 5)).toBe(true);
      expect(testGame.isOutOfBounds(19, 5)).toBe(false);
    });

    it("moveClaim forward", () => {
      testGame.addShip("testShip", ShipType.WAR_FRIG, 1, 2, "DEFENDER");
      testGame.getShipById("testShip").setOrientation(Orientation.SOUTH);

      const move = new Move(Direction.FORWARD, "testShip");
      testGame.moveClaim(move);

      expect(testGame.getCell(1, 3).claiming).toEqual([
        { id: "testShip", claimedPriority: 1 },
      ]);
    });

    it("moveClaim left", () => {
      testGame.addShip("testShip", ShipType.WAR_FRIG, 1, 2, "DEFENDER");
      testGame.getShipById("testShip").setOrientation(Orientation.SOUTH);

      const move = new Move(Direction.LEFT, "testShip");
      testGame.moveClaim(move);

      expect(testGame.getCell(1, 3).claiming).toEqual([
        { id: "testShip", claimedPriority: 1 },
      ]);
      expect(testGame.getCell(2, 3).claiming).toEqual([
        { id: "testShip", claimedPriority: 2 },
      ]);
    });

    it("moveClaim right", () => {
      testGame.addShip("testShip", ShipType.WAR_FRIG, 1, 2, "DEFENDER");
      testGame.getShipById("testShip").setOrientation(Orientation.SOUTH);

      const move = new Move(Direction.RIGHT, "testShip");
      testGame.moveClaim(move);

      expect(testGame.getCell(1, 3).claiming).toEqual([
        { id: "testShip", claimedPriority: 1 },
      ]);
      expect(testGame.getCell(0, 3).claiming).toEqual([
        { id: "testShip", claimedPriority: 2 },
      ]);
    });

    it("_rammedThisTurn", () => {
      testGame.rammedShipsPerTurn.push(["testShip1", "testShip2"]);
      expect(testGame._rammedThisTurn("testShip1", "testShip2")).toBe(true);
      expect(testGame._rammedThisTurn("testShip1", "testShip3")).toBe(false);
    });

    it("onGameTurn", () => {
      testGame.addShip("ship1", ShipType.WAR_FRIG, 0, 4, "DEFENDER");
      testGame.addShip("ship2", ShipType.WAR_FRIG, 1, 4, "ATTACKER");

      const player1 = testGame.getPlayer("ship1");
      const player2 = testGame.getPlayer("ship2");

      const p1Move1 = new Move(Direction.LEFT, player1.playerName);
      const p2Move1 = new Move(Direction.FORWARD, player2.playerName);

      player1.setFirstMove(p1Move1);
      player2.setFirstMove(p2Move1);

      testGame.onGameTurn();

      expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");
      const testGameTurnData = {
        playerMovements: {
          turn_1: [
            {
              playerName: "ship1",
              direction: "LEFT",
              cancelledTurnal: true,
              cancelledMovement: false,
            },
            {
              playerName: "ship2",
              direction: "FORWARD",
              cancelledTurnal: false,
              cancelledMovement: false,
            },
          ],
          turn_1_shots: [],
          turn_2: [],
          turn_2_shots: [],
          turn_3: [],
          turn_3_shots: [],
          turn_4: [],
          turn_4_shots: [],
        },
        playerData: [
          { playerName: "ship1", boardX: 0, boardY: 5, orientation: "EAST" },
          { playerName: "ship2", boardX: 1, boardY: 5, orientation: "SOUTH" },
        ],
      };

      expect(jestEmitMock.mock.calls[0][1]).toStrictEqual(testGameTurnData);
    });

    it("isWind", () => {
      const isWind = testGame.isWind;
      const windCellIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const nonWindCells = [-1, 0, 13, 14, "what"];

      for (let windId of windCellIds) {
        expect(isWind(windId)).toBe(true);
      }

      for (let nonWindId of nonWindCells) {
        expect(isWind(nonWindId)).toBe(false);
      }
    });
  });

  describe("handling claims", () => {
    let ship1;
    let ship2;
    beforeEach(() => {
      ship1 = testGame.addShip("ship1", ShipType.WAR_FRIG, 15, 3, "DEFENDER");
      ship2 = testGame.addShip("ship2", ShipType.WAR_FRIG, 15, 5, "DEFENDER");

      ship1.setOrientation(Orientation.SOUTH);
      ship2.setOrientation(Orientation.NORTH);
    });

    it("forward movements", () => {
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.FORWARD, "ship1");

      const ship2Moves = new PlayerMoves("ship2");
      ship2Moves.firstMove = new Move(Direction.FORWARD, "ship2");

      //Claim cells from moves.
      testGame.moveClaim(ship1Moves.firstMove);
      testGame.moveClaim(ship2Moves.firstMove);
      //Handle claim conflicts
      testGame._handleClaims([ship1Moves, ship2Moves], "firstMove");

      //Expect ram damage to be taken
      expect(ship1.damage).toBe(ship2.shipType.ramDamage);
      expect(ship2.damage).toBe(ship1.shipType.ramDamage);

      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
      expect(ship2Moves.firstMove.cancelledMovement).toBe(true);
    });

    it("forward border collision", () => {
      testGame.setShipPosition("ship1", 0, 3);
      ship1.setOrientation(Orientation.WEST);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.FORWARD, "ship1");

      testGame.moveClaim(ship1Moves.firstMove);
      testGame._handleClaims([ship1Moves], "firstMove");
      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
    });

    it("turnal border collision", () => {
      testGame.setShipPosition("ship1", 0, 3);
      ship1.setOrientation(Orientation.WEST);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.RIGHT, "ship1");

      testGame.moveClaim(ship1Moves.firstMove);
      testGame._handleClaims([ship1Moves], "firstMove");
      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
      // expect(ship1Moves.firstMove.cancelledTurnal).toBe(true);
    });

    it("forward rock collision", () => {
      testGame.setShipPosition("ship1", 0, 6);
      ship1.setOrientation(Orientation.SOUTH);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.FORWARD, "ship1");

      testGame.moveClaim(ship1Moves.firstMove);
      testGame._handleClaims([ship1Moves], "firstMove");

      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
    });

    it("turnal rock collision", () => {
      testGame.setShipPosition("ship1", 1, 6);
      ship1.setOrientation(Orientation.WEST);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.LEFT, "ship1");

      testGame.moveClaim(ship1Moves.firstMove, "firstMove");
      testGame._handleClaims([ship1Moves]);

      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(false);
      expect(ship1Moves.firstMove.cancelledTurnal).toBe(true);
    });

    it("Turning - 2 turning ships collision, cancelled movement", () => {
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.LEFT, "ship1");
      const ship2Moves = new PlayerMoves("ship2");
      ship2Moves.firstMove = new Move(Direction.RIGHT, "ship2");

      //Claim cells from moves.
      testGame.moveClaim(ship1Moves.firstMove);
      testGame.moveClaim(ship2Moves.firstMove);

      //Handle claim conflicts
      testGame._handleClaims([ship1Moves, ship2Moves], "firstMove");

      //Expect ram damage to be taken
      expect(ship1.damage).toBe(ship2.shipType.ramDamage);
      expect(ship2.damage).toBe(ship1.shipType.ramDamage);

      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
      expect(ship2Moves.firstMove.cancelledMovement).toBe(true);
    });

    it("Turning - cancelled turnal but still move forward", () => {
      testGame.setShipPosition("ship1", 0, 6);
      ship1.setOrientation(Orientation.NORTH);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.LEFT, "ship1");

      testGame.moveClaim(ship1Moves.firstMove, "firstMove");
      testGame._handleClaims([ship1Moves]);

      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(false);
      expect(ship1Moves.firstMove.cancelledTurnal).toBe(true);
    });

    it("turnal vs ship in front, heading same direction", () => {
      testGame.setShipPosition("ship2", 15, 4);
      testGame.setShipPosition("ship1", 15, 6);
      ship1.setOrientation(Orientation.NORTH);
      ship2.setOrientation(Orientation.SOUTH);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.FORWARD, "ship1");

      const ship2Moves = new PlayerMoves("ship2");
      ship2Moves.firstMove = new Move(Direction.RIGHT, "ship2");

      //Claim cells from moves.
      testGame.moveClaim(ship1Moves.firstMove);
      testGame.moveClaim(ship2Moves.firstMove);

      //Handle claim conflicts
      testGame._handleClaims([ship1Moves, ship2Moves], "firstMove");

      //Expect ram damage to be taken
      expect(ship1.damage).toBe(ship2.shipType.ramDamage);
      expect(ship2.damage).toBe(ship1.shipType.ramDamage);

      // Detect cancellation of moves

      // TODO
      // expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
      // expect(ship2Moves.firstMove.cancelledMovement).toBe(true);
      // expect(ship2Moves.firstMove.cancelledTurnal).toBe(true);
    });

    it("turnal priorities", () => {
      testGame.setShipPosition("ship2", 16, 5);

      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.LEFT, "ship1");
      const ship2Moves = new PlayerMoves("ship2");
      ship2Moves.firstMove = new Move(Direction.FORWARD, "ship2");

      testGame.moveClaim(ship1Moves.firstMove);
      testGame.moveClaim(ship2Moves.firstMove);

      testGame._handleClaims([ship1Moves, ship2Moves], "firstMove");

      expect(ship1.damage).toBe(ship2.shipType.ramDamage);
      expect(ship2.damage).toBe(ship1.shipType.ramDamage);

      expect(ship1Moves.firstMove.cancelledTurnal).toBe(true);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(false);
      expect(ship2Moves.firstMove.cancelledMovement).toBe(false);
    });
  });

  describe("movement ", () => {
    let ship1;
    let ship2;
    beforeEach(() => {
      ship1 = testGame.addShip("testShip", ShipType.WAR_FRIG, 6, 0, "DEFENDER");
      ship1.setOrientation(Orientation.SOUTH);
    });

    describe("executes moves and in order", () => {
      let ship1Moves;
      beforeEach(() => {
        ship1Moves = new PlayerMoves("testShip");
      });
      it("Free movement", () => {
        ship1Moves.setFirstMove(Direction.FORWARD);
        ship1Moves.setSecondMove(Direction.LEFT);
        ship1Moves.setThirdMove(Direction.RIGHT);
        ship1Moves.setFourthMove(Direction.FORWARD);

        testGame.executeMoves([ship1Moves]);
        expect(ship1.boardX).toBe(8);
        expect(ship1.boardY).toBe(4);
        expect(testGame.getCell(8, 4).occupiedBy).toBe("testShip");
        expect(ship1.getOrientation()).toBe(Orientation.SOUTH);
      });

      it("Ship vs Ship proper movement and ram collision", () => {
        ship1Moves.setFirstMove(Direction.FORWARD);
        ship1Moves.setSecondMove(Direction.LEFT);

        ship2 = testGame.addShip("ship2", ShipType.WAR_FRIG, 8, 0, "DEFENDER");
        ship2.setOrientation(Orientation.SOUTH);
        const ship2Moves = new PlayerMoves("ship2");
        ship2Moves.setFirstMove(Direction.FORWARD);
        ship2Moves.setSecondMove(Direction.RIGHT);

        testGame.executeMoves([ship1Moves, ship2Moves]);
        expect(ship1.boardX).toBe(6);
        expect(ship1.boardY).toBe(2);
        expect(ship1.damage).toBe(ship2.shipType.ramDamage);
        expect(ship1.getOrientation()).toBe(Orientation.EAST);
        expect(ship2.getOrientation()).toBe(Orientation.WEST);
        expect(ship2.boardX).toBe(8);
        expect(ship2.boardY).toBe(2);
        expect(ship2.damage).toBe(ship1.shipType.ramDamage);
      });
    });
  });
});
