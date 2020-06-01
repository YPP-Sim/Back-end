const Game = require("../game/game");
const ShipType = require("../game/ShipType");
const Direction = require("../game/Direction");
const Orientation = require("../game/Orientation");
const Move = require("../game/moves/Move");
const PlayerMoves = require("../game/moves/PlayerMoves");

const testMap = [
  [1, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 15, 0, 15, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 15, 15, 0, 11, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 0, 14, 0, 10, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 7, 8, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 6, 5, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 0, 0, 0, 4, 4, 4, 4, 4, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0],
];

let testGame;
describe("Game", () => {
  beforeEach(() => {
    testGame = new Game(testMap);
  });

  describe("common functions", () => {
    it("adds ship", () => {
      testGame.addShip("testShip", ShipType.WAR_FRIG, 1, 2, "DEFENDER");
      expect(testGame.defenders["testShip"]).not.toBe(undefined);
      expect(testGame.getCell(1, 2).occupiedBy).toEqual("testShip");
      expect(testGame.getCell(1, 2).cell_id).toEqual(0);
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
  });

  describe("handling claims", () => {
    let ship1;
    let ship2;
    beforeEach(() => {
      ship1 = testGame.addShip("ship1", ShipType.WAR_FRIG, 15, 0, "DEFENDER");
      ship2 = testGame.addShip("ship2", ShipType.WAR_FRIG, 15, 2, "DEFENDER");

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
      ship1.setOrientation(Orientation.NORTH);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.FORWARD, "ship1");

      testGame.moveClaim(ship1Moves.firstMove);
      testGame._handleClaims([ship1Moves], "firstMove");
      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
    });

    it("turnal border collision", () => {
      ship1.setOrientation(Orientation.WEST);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.RIGHT, "ship1");

      testGame.moveClaim(ship1Moves.firstMove);
      testGame._handleClaims([ship1Moves], "firstMove");
      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(false);
      expect(ship1Moves.firstMove.cancelledTurnal).toBe(true);
    });

    it("forward rock collision", () => {
      testGame.setShipPosition("ship1", 0, 3);
      ship1.setOrientation(Orientation.SOUTH);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.FORWARD, "ship1");

      testGame.moveClaim(ship1Moves.firstMove);
      testGame._handleClaims([ship1Moves], "firstMove");

      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(true);
    });

    it("turnal rock collision", () => {
      testGame.setShipPosition("ship1", 1, 3);
      ship1.setOrientation(Orientation.WEST);
      const ship1Moves = new PlayerMoves("ship1");
      ship1Moves.firstMove = new Move(Direction.LEFT, "ship1");

      testGame.moveClaim(ship1Moves.firstMove, "firstMove");
      testGame._handleClaims([ship1Moves]);

      expect(ship1.damage).toBe(ship1.shipType.rockDamage);
      expect(ship1Moves.firstMove.cancelledMovement).toBe(false);
      expect(ship1Moves.firstMove.cancelledTurnal).toBe(true);
    });

    it("turnal movements", () => {
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

    it("turnal vs ship in front, heading same direction", () => {
      testGame.setShipPosition("ship2", 15, 1);
      ship1.setOrientation(Orientation.EAST);
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
      expect(ship1Moves.firstMove.cancelledMovement).toBe(false);
      expect(ship2Moves.firstMove.cancelledMovement).toBe(false);
      expect(ship2Moves.firstMove.cancelledTurnal).toBe(true);
    });

    it("turnal priorities", () => {
      testGame.setShipPosition("ship2", 16, 2);
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
    beforeEach(() => {
      ship1 = testGame.addShip("testShip", ShipType.WAR_FRIG, 6, 0, "DEFENDER");
      ship1.setOrientation(Orientation.SOUTH);
    });

    describe("executes moves and in order", () => {
      let ship1Moves;
      beforeEach(() => {
        ship1Moves = new PlayerMoves("testShip");
      });
      it("Moves: FLRF", () => {
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
    });
  });
});
