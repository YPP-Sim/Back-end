const Game = require("../game/game");
const ShipType = require("../game/ShipType");
const Direction = require("../game/Direction");
const Orientation = require("../game/Orientation");
const Move = require("../game/moves/Move");
const PlayerMoves = require("../game/moves/PlayerMoves");
const JobberQuality = require("../game/JobberQuality");
const util = require("util");
const PlayerShip = require("../game/PlayerShip");

// Will console log out all the io events and data that would be sent by the server
// during testing
let logMockEmits = false;

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
  in: () => {
    return {
      emit: jestEmitMock,
    };
  },
};

const socketEmitMock = jest.fn(mockEmit);

const socketMock = {
  emit: socketEmitMock,
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("common functions", () => {
    it("adds ship", () => {
      testGame.addShip(
        "testShip",
        ShipType.WAR_FRIG,
        1,
        2,
        "DEFENDER",
        socketMock
      );
      expect(testGame.defenders["testShip"]).not.toBe(undefined);
      expect(testGame.getCell(1, 2).occupiedBy).toEqual("testShip");
      expect(testGame.getCell(1, 2).cell_id).toEqual(-1); // This is technically safe zone
    });

    it("gets ship by id", () => {
      testGame.addShip(
        "testShip",
        ShipType.WAR_FRIG,
        1,
        2,
        "DEFENDER",
        socketMock
      );
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
      testGame.addShip(
        "testShip",
        ShipType.WAR_FRIG,
        1,
        2,
        "DEFENDER",
        socketMock
      );
      testGame.getShipById("testShip").setOrientation(Orientation.SOUTH);

      const move = new Move(Direction.FORWARD, "testShip");
      testGame.moveClaim(move, move.moveOwner);

      expect(testGame.getCell(1, 3).claiming).toEqual([
        { id: "testShip", claimedPriority: 1 },
      ]);
    });

    it("moveClaim left", () => {
      testGame.addShip(
        "testShip",
        ShipType.WAR_FRIG,
        1,
        2,
        "DEFENDER",
        socketMock
      );
      testGame.getShipById("testShip").setOrientation(Orientation.SOUTH);

      const move = new Move(Direction.LEFT, "testShip");
      testGame.moveClaim(move, move.moveOwner);

      expect(testGame.getCell(1, 3).claiming).toEqual([
        { id: "testShip", claimedPriority: 1 },
      ]);
      expect(testGame.getCell(2, 3).claiming).toEqual([
        { id: "testShip", claimedPriority: 2 },
      ]);
    });

    it("moveClaim right", () => {
      testGame.addShip(
        "testShip",
        ShipType.WAR_FRIG,
        1,
        2,
        "DEFENDER",
        socketMock
      );
      testGame.getShipById("testShip").setOrientation(Orientation.SOUTH);

      const move = new Move(Direction.RIGHT, "testShip");
      testGame.moveClaim(move, move.moveOwner);

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
      testGame.addShip(
        "ship1",
        ShipType.WAR_FRIG,
        0,
        4,
        "DEFENDER",
        socketMock
      );
      testGame.addShip(
        "ship2",
        ShipType.WAR_FRIG,
        1,
        4,
        "ATTACKER",
        socketMock
      );

      const player1 = testGame.getPlayer("ship1");
      const player2 = testGame.getPlayer("ship2");

      const p1Move1 = new Move(Direction.LEFT, player1.playerName);
      const p2Move1 = new Move(Direction.FORWARD, player2.playerName);

      player1.setFirstMove(p1Move1);
      player2.setFirstMove(p2Move1);

      testGame.onGameTurn();

      expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

      const testGameTurnData = {
        flags: [],
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
          turn_1_winds: [],
          turn_1_shots: [],
          turn_1_sinks: [],

          turn_2: [],
          turn_2_winds: [],
          turn_2_shots: [],
          turn_2_sinks: [],

          turn_3: [],
          turn_3_winds: [],
          turn_3_shots: [],
          turn_3_sinks: [],

          turn_4: [],
          turn_4_winds: [],
          turn_4_shots: [],
          turn_4_sinks: [],
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
      ship1 = testGame.addShip(
        "ship1",
        ShipType.WAR_FRIG,
        15,
        3,
        "DEFENDER",
        socketMock
      );
      ship2 = testGame.addShip(
        "ship2",
        ShipType.WAR_FRIG,
        15,
        5,
        "DEFENDER",
        socketMock
      );

      ship1.setOrientation(Orientation.SOUTH);
      ship2.setOrientation(Orientation.NORTH);
    });

    it("forward movement", () => {
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.setFirstMove(Direction.FORWARD);

      const ship2Moves = new PlayerMoves("ship2");
      ship2Moves.setFirstMove(Direction.FORWARD);

      //Claim cells from moves.
      testGame.moveClaim(ship1Moves.move1, ship1Moves.shipId);
      testGame.moveClaim(ship2Moves.move1, ship2Moves.shipId);
      //Handle claim conflicts
      testGame._handleClaims([ship1Moves, ship2Moves], "move1");

      //Expect ram damage to be taken
      expect(ship1.damage).toBe(ship2.shipType.ramDamage);
      expect(ship2.damage).toBe(ship1.shipType.ramDamage);

      expect(ship1Moves.move1.cancelledMovement).toBe(true);
      expect(ship2Moves.move1.cancelledMovement).toBe(true);
    });

    it("forward border collision", () => {
      testGame.setShipPosition("ship1", 0, 3);
      ship1.setOrientation(Orientation.WEST);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.FORWARD, "ship1");

      testGame.moveClaim(ship1Moves.firstMove, ship1Moves.shipId);
      testGame._handleClaims([ship1Moves], "firstMove");
      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
    });

    it("turnal border collision", () => {
      testGame.setShipPosition("ship1", 0, 3);
      ship1.setOrientation(Orientation.WEST);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.RIGHT, "ship1");

      testGame.moveClaim(ship1Moves.firstMove, ship1Moves.shipId);
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

      testGame.moveClaim(ship1Moves.firstMove, ship1Moves.shipId);
      testGame._handleClaims([ship1Moves], "firstMove");

      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
    });

    it("turnal rock collision", () => {
      testGame.setShipPosition("ship1", 1, 6);
      ship1.setOrientation(Orientation.WEST);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.LEFT, "ship1");

      testGame.moveClaim(ship1Moves.firstMove, ship1Moves.shipId);
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
      testGame.moveClaim(ship1Moves.firstMove, ship1Moves.shipId);
      testGame.moveClaim(ship2Moves.firstMove, ship2Moves.shipId);

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

      testGame.moveClaim(ship1Moves.firstMove, ship1Moves.shipId);
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
      testGame.moveClaim(ship1Moves.firstMove, ship1Moves.shipId);
      testGame.moveClaim(ship2Moves.firstMove, ship2Moves.shipId);

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

      testGame.moveClaim(ship1Moves.firstMove, ship1Moves.shipId);
      testGame.moveClaim(ship2Moves.firstMove, ship2Moves.shipId);

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
      ship1 = testGame.addShip(
        "testShip",
        ShipType.WAR_FRIG,
        6,
        0,
        "DEFENDER",
        socketMock
      );
      ship1.setOrientation(Orientation.SOUTH);

      jest.clearAllMocks();
    });

    describe("winds/whirlwinds", () => {
      it("north wind push", () => {
        testGame.setShipPosition(ship1.shipId, 1, 4);
        testGame.onGameTurn();
        expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

        const { turn_1_winds } = jestEmitMock.mock.calls[0][1].playerMovements;
        const compareObj = {
          playerName: "testShip",
          windType: { type: "NORTH_WIND", cancelledMovement: false },
        };

        expect(turn_1_winds.length).toBe(1);
        expect(turn_1_winds[0]).toStrictEqual(compareObj);

        expect(ship1.boardX).toBe(1);
        expect(ship1.boardY).toBe(3);
      });

      it("Constant cycle whirlpool standing still no movements", () => {
        testGame.setShipPosition(ship1.shipId, 18, 4);
        ship1.setOrientation(Orientation.WEST);
        testGame.onGameTurn();
        expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

        const {
          turn_1_winds,
          turn_2_winds,
          turn_3_winds,
          turn_4_winds,
        } = jestEmitMock.mock.calls[0][1].playerMovements;
        const compareObj1 = {
          playerName: "testShip",
          windType: {
            type: "WHIRLWIND_CLOCKWISE_SW",
            cancelledMovement: false,
          },
        };
        expect(turn_1_winds.length).toBe(1);
        expect(turn_1_winds[0]).toStrictEqual(compareObj1);
        expect(turn_2_winds[0].windType.type).toBe("WHIRLWIND_CLOCKWISE_NE");
        expect(turn_3_winds[0].windType.type).toBe("WHIRLWIND_CLOCKWISE_SW");
        expect(turn_4_winds[0].windType.type).toBe("WHIRLWIND_CLOCKWISE_NE");
        expect(ship1.boardX).toBe(18);
        expect(ship1.boardY).toBe(4);
      });
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
        expect(ship1.boardX).toBe(9);
        expect(ship1.boardY).toBe(3);
        expect(testGame.getCell(9, 3).occupiedBy).toBe("testShip");
        expect(ship1.getOrientation()).toBe(Orientation.SOUTH);
        expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      });

      it("Ship vs Ship proper movement and ram collision", () => {
        ship1Moves.setFirstMove(Direction.FORWARD);
        ship1Moves.setSecondMove(Direction.LEFT);

        ship2 = testGame.addShip(
          "ship2",
          ShipType.WAR_FRIG,
          8,
          0,
          "DEFENDER",
          socketMock
        );
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

  describe("Full turn interactions", () => {
    beforeEach(() => {
      // Add ships
      testGame.addShip(
        "ship1",
        ShipType.WAR_FRIG,
        0,
        6,
        "DEFENDER",
        socketMock
      );
      testGame.addShip(
        "ship2",
        ShipType.WAR_FRIG,
        1,
        6,
        "ATTACKER",
        socketMock
      );

      testGame.getShipById("ship1").setOrientation(Orientation.SOUTH);
      testGame.getShipById("ship2").setOrientation(Orientation.SOUTH);
    });

    afterEach(() => {
      // Clear Mocks
      jest.clearAllMocks();
      // Remove ships
      testGame.removePlayer("ship1");
      testGame.removePlayer("ship2");
    });

    it("handles ship sinks", () => {
      const player1 = testGame.getPlayer("ship1");
      const player2 = testGame.getPlayer("ship2");
      player1.getShip().damage = 40;

      player1.getMoves().setFourthMove(Direction.FORWARD);
      player2.addCannons(24);
      player2.getMoves().setGuns(1, "right", [true, true]);
      player2.getMoves().setGuns(2, "right", [true, true]);
      player2.getMoves().setGuns(3, "right", [true, true]);
      player2.getMoves().setGuns(4, "right", [true, true]);

      testGame.onGameTurn();

      expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

      const gameEmitData = jestEmitMock.mock.calls[0][1];
      const { turn_3_sinks, turn_4 } = gameEmitData.playerMovements;

      expect(turn_3_sinks.length).toBe(1);
      expect(turn_3_sinks[0]).toStrictEqual({
        playerName: "ship1",
      });
      expect(turn_4.length).toBe(0);
    });
  });

  describe("spawning", () => {
    let attackerPlayer;
    let defenderPlayer;
    beforeEach(() => {
      // Add players
      testGame.addAttacker("attacker1", socketMock);
      testGame.addDefender("defender1", socketMock);

      attackerPlayer = testGame.getPlayer("attacker1");
      defenderPlayer = testGame.getPlayer("defender1");
      attackerPlayer.ship = new PlayerShip(
        attackerPlayer.playerName,
        ShipType.WAR_FRIG,
        "ATTACKER",
        testGame
      );
      defenderPlayer.ship = new PlayerShip(
        defenderPlayer.playerName,
        ShipType.WAR_FRIG,
        "DEFENDER",
        testGame
      );
    });

    afterEach(() => {
      testGame.removePlayer("attacker1");
      testGame.removePlayer("defender1");
    });

    it("spawns attackers correctly", () => {
      testGame._setRandomSpawns();

      const attackerShip = testGame.getShipById("attacker1");
      expect(attackerShip).not.toBeNull();
      expect(attackerShip.boardY).toBeGreaterThanOrEqual(testMap.length + 3);
      expect(attackerShip.boardY).toBeLessThan(testMap.length + 6);
    });

    it("spawns defenders correctly", () => {
      testGame._setRandomSpawns();

      const defenderShip = testGame.getShipById("defender1");
      expect(defenderShip).not.toBeNull();
      expect(defenderShip.boardY).toBeGreaterThanOrEqual(0);
      expect(defenderShip.boardY).toBeLessThan(3);
    });
  });

  describe("full collision handling", () => {
    let player;
    let player2;
    beforeEach(() => {
      // Add player
      testGame.addAttacker("attacker1", socketMock);
      testGame.addDefender("defender1", socketMock);

      player = testGame.getPlayer("attacker1");
      player2 = testGame.getPlayer("defender1");

      player.ship = new PlayerShip(
        player.playerName,
        ShipType.WAR_FRIG,
        "ATTACKER",
        testGame
      );

      player2.ship = new PlayerShip(
        player2.playerName,
        ShipType.WAR_FRIG,
        "DEFENDER",
        testGame
      );
    });

    afterEach(() => {
      testGame.removePlayer("attacker1");
      testGame.removePlayer("defender1");
      jest.clearAllMocks();
    });

    describe("rock collisions", () => {
      describe("Rock directly in front of ship", () => {
        beforeEach(() => {
          const ship = player.getShip();
          testGame.setShipPosition(ship.shipId, 1, 6);
          ship.setOrientation(Orientation.SOUTH);

          ship.damage = 0;
          ship.bilge = 0;
        });

        afterEach(() => {
          jest.clearAllMocks();
        });

        it("correctly handles FORWARD direction", () => {
          player.getMoves().setFirstMove(Direction.FORWARD);
          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;

          expect(turn_1.length).toBe(1);

          const compareObj = {
            playerName: player.playerName,
            direction: "FORWARD",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          expect(turn_1[0]).toStrictEqual(compareObj);
          expect(player.getShip().damage).toEqual(
            player.getShip().shipType.rockDamage
          );
        });

        it("correctly handles RIGHT direction", () => {
          player.getMoves().setFirstMove(Direction.RIGHT);
          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;

          expect(turn_1.length).toBe(1);

          const compareObj = {
            playerName: player.playerName,
            direction: "RIGHT",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          expect(turn_1[0]).toStrictEqual(compareObj);
          expect(player.getShip().getOrientation()).toStrictEqual(
            Orientation.WEST
          );
          expect(player.getShip().damage).toEqual(
            player.getShip().shipType.rockDamage
          );
        });

        it("correctly handles LEFT direction", () => {
          player.getMoves().setFirstMove(Direction.LEFT);
          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;

          expect(turn_1.length).toBe(1);

          const compareObj = {
            playerName: player.playerName,
            direction: "LEFT",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          expect(turn_1[0]).toStrictEqual(compareObj);
          expect(player.getShip().getOrientation()).toStrictEqual(
            Orientation.EAST
          );
          expect(player.getShip().damage).toEqual(
            player.getShip().shipType.rockDamage
          );
        });
      });

      describe("Rock at side, turning into rock", () => {
        beforeEach(() => {
          const ship = player.getShip();
          testGame.setShipPosition(ship.shipId, 10, 3);
          ship.setOrientation(Orientation.SOUTH);

          ship.damage = 0;
          ship.bilge = 0;
        });

        afterEach(() => {
          jest.clearAllMocks();
        });

        it("handles LEFT turn into rock", () => {
          player.getMoves().setFirstMove(Direction.LEFT);
          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;

          expect(turn_1.length).toBe(1);

          const compareObj = {
            playerName: player.playerName,
            direction: "LEFT",
            cancelledTurnal: true,
            cancelledMovement: false,
          };

          expect(turn_1[0]).toStrictEqual(compareObj);
          expect(player.getShip().getOrientation()).toStrictEqual(
            Orientation.EAST
          );
          expect(player.getShip().damage).toEqual(
            player.getShip().shipType.rockDamage
          );

          expect(player.getShip().boardX).toEqual(10);
          expect(player.getShip().boardY).toEqual(4);
        });

        it("handles RIGHT turn into rock", () => {
          player.getMoves().setFirstMove(Direction.RIGHT);
          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;

          expect(turn_1.length).toBe(1);

          const compareObj = {
            playerName: player.playerName,
            direction: "RIGHT",
            cancelledTurnal: true,
            cancelledMovement: false,
          };

          expect(turn_1[0]).toStrictEqual(compareObj);
          expect(player.getShip().getOrientation()).toStrictEqual(
            Orientation.WEST
          );
          expect(player.getShip().damage).toEqual(
            player.getShip().shipType.rockDamage
          );

          expect(player.getShip().boardX).toEqual(10);
          expect(player.getShip().boardY).toEqual(4);
        });
      });
    });

    describe("ship on ship collisions", () => {
      afterEach(() => {
        jest.clearAllMocks();
      });

      it("ship move FORWARD into other stationary ship", () => {
        player.ship.setPosition(6, 5);
        player.ship.setOrientation(Orientation.EAST);
        player2.ship.setPosition(7, 5);
        player.getMoves().setFirstMove(Direction.FORWARD);
        testGame.onGameTurn();
        expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

        const gameEmitData = jestEmitMock.mock.calls[0][1];
        const { turn_1 } = gameEmitData.playerMovements;

        expect(turn_1.length).toBe(1);

        const compareObj = {
          playerName: player.playerName,
          direction: "FORWARD",
          cancelledTurnal: false,
          cancelledMovement: true,
        };

        expect(turn_1[0]).toStrictEqual(compareObj);
        expect(player.getShip().damage).toEqual(
          player.getShip().shipType.ramDamage
        );
      });

      it("ship move FORWARD collides into other stationary ship while shooting - Bug Fix", () => {
        player.ship.setPosition(6, 5);
        player.ship.setOrientation(Orientation.EAST);
        player2.ship.setPosition(7, 5);
        player2.ship.setOrientation(Orientation.SOUTH);
        player.getMoves().setFirstMove(Direction.FORWARD);
        player2.getMoves().setGuns(1, "right", [true, true]);
        testGame.onGameTurn();
        expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

        const gameEmitData = jestEmitMock.mock.calls[0][1];
        const { turn_1 } = gameEmitData.playerMovements;

        expect(turn_1.length).toBe(1);

        const compareObj = {
          playerName: player.playerName,
          direction: "FORWARD",
          cancelledTurnal: false,
          cancelledMovement: true,
        };

        expect(turn_1[0]).toStrictEqual(compareObj);
        expect(player.getShip().damage).toEqual(
          player.getShip().shipType.ramDamage
        );
      });

      it("ship move LEFT into other stationary ship", () => {
        player.ship.setPosition(6, 5);
        player.ship.setOrientation(Orientation.EAST);
        player2.ship.setPosition(7, 5);

        player.getMoves().setFirstMove(Direction.LEFT);
        testGame.onGameTurn();
        expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

        const gameEmitData = jestEmitMock.mock.calls[0][1];
        const { turn_1 } = gameEmitData.playerMovements;

        expect(turn_1.length).toBe(1);

        const compareObj = {
          playerName: player.playerName,
          direction: "LEFT",
          cancelledTurnal: false,
          cancelledMovement: true,
        };

        expect(turn_1[0]).toStrictEqual(compareObj);
        expect(player.getShip().damage).toEqual(
          player.getShip().shipType.ramDamage
        );
      });

      it("ship move RIGHT into other stationary ship", () => {
        player.ship.setPosition(6, 5);
        player.ship.setOrientation(Orientation.EAST);
        player2.ship.setPosition(7, 5);

        player.getMoves().setFirstMove(Direction.RIGHT);
        testGame.onGameTurn();
        expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

        const gameEmitData = jestEmitMock.mock.calls[0][1];
        const { turn_1 } = gameEmitData.playerMovements;

        expect(turn_1.length).toBe(1);

        const compareObj = {
          playerName: player.playerName,
          direction: "RIGHT",
          cancelledTurnal: false,
          cancelledMovement: true,
        };

        expect(turn_1[0]).toStrictEqual(compareObj);
        expect(player.getShip().damage).toEqual(
          player.getShip().shipType.ramDamage
        );
      });

      describe("2 ships looking at eachother, correctly handing collision on move", () => {
        beforeEach(() => {
          player.ship.setPosition(6, 5);
          player.ship.setOrientation(Orientation.EAST);
          player2.ship.setPosition(7, 5);
          player2.ship.setOrientation(Orientation.WEST);
        });

        it("both moving FORWARD", () => {
          player.getMoves().setFirstMove(Direction.FORWARD);
          player2.getMoves().setFirstMove(Direction.FORWARD);

          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;

          expect(turn_1.length).toBe(2);

          const player1MovementObject = {
            playerName: player.playerName,
            direction: "FORWARD",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          const player2MovementObject = {
            playerName: player2.playerName,
            direction: "FORWARD",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          expect(turn_1[0]).toStrictEqual(player1MovementObject);
          expect(turn_1[1]).toStrictEqual(player2MovementObject);

          expect(player.getShip().damage).toEqual(
            player2.getShip().shipType.ramDamage
          );

          expect(player2.getShip().damage).toEqual(
            player.getShip().shipType.ramDamage
          );
        });

        it("both moving LEFT", () => {
          player.getMoves().setFirstMove(Direction.LEFT);
          player2.getMoves().setFirstMove(Direction.LEFT);

          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;

          expect(turn_1.length).toBe(2);

          const player1MovementObject = {
            playerName: player.playerName,
            direction: "LEFT",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          const player2MovementObject = {
            playerName: player2.playerName,
            direction: "LEFT",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          expect(turn_1[0]).toStrictEqual(player1MovementObject);
          expect(turn_1[1]).toStrictEqual(player2MovementObject);

          expect(player.getShip().damage).toEqual(
            player2.getShip().shipType.ramDamage
          );

          expect(player2.getShip().damage).toEqual(
            player.getShip().shipType.ramDamage
          );
        });

        it("both moving RIGHT", () => {
          player.getMoves().setFirstMove(Direction.RIGHT);
          player2.getMoves().setFirstMove(Direction.RIGHT);

          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;

          expect(turn_1.length).toBe(2);

          const player1MovementObject = {
            playerName: player.playerName,
            direction: "RIGHT",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          const player2MovementObject = {
            playerName: player2.playerName,
            direction: "RIGHT",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          expect(turn_1[0]).toStrictEqual(player1MovementObject);
          expect(turn_1[1]).toStrictEqual(player2MovementObject);

          expect(player.getShip().damage).toEqual(
            player2.getShip().shipType.ramDamage
          );

          expect(player2.getShip().damage).toEqual(
            player.getShip().shipType.ramDamage
          );
        });

        it("one moves, one sits stationary", () => {
          player.getMoves().setFirstMove(Direction.LEFT);

          testGame.onGameTurn();
          expect(jestEmitMock.mock.calls[0][0]).toBe("gameTurn");

          const gameEmitData = jestEmitMock.mock.calls[0][1];
          const { turn_1 } = gameEmitData.playerMovements;
          expect(turn_1.length).toBe(1);

          const player1MovementObject = {
            playerName: player.playerName,
            direction: "LEFT",
            cancelledTurnal: false,
            cancelledMovement: true,
          };

          expect(turn_1[0]).toStrictEqual(player1MovementObject);

          expect(player.getShip().damage).toEqual(
            player2.getShip().shipType.ramDamage
          );

          expect(player2.getShip().damage).toEqual(
            player.getShip().shipType.ramDamage
          );
        });
      });
    });
  });
});
