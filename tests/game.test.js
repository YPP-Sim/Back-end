const Game = require("../game/game");
const ShipType = require("../game/ShipType");
const Direction = require("../game/Direction");
const Orientation = require("../game/Orientation");

const testMap = [
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 15, 15, 0, 11, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 0, 14, 0, 10, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 7, 8, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 6, 5, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 0, 0, 0, 4, 4, 4, 4, 4, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0],
];

let testGame;
describe("Game functions", () => {
  beforeEach(() => {
    testGame = new Game(testMap);
  });

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

  // ------------ SHIP MOVEMENT - NO COLLISION -----------------
  describe("Ship movement - no collision", () => {
    beforeEach(() => {
      testGame = new Game(testMap);
      testGame.addShip("testShip", ShipType.WAR_FRIG, 1, 2, "DEFENDER");
      testGame.getShipById("testShip").setOrientation(Orientation.SOUTH);
    });

    it("moves ships forward", () => {
      expect(testGame.getCell(1, 2).cell_id).toEqual(0);
      testGame.moveShip("testShip", Direction.FORWARD);
      expect(testGame.getCell(1, 2).occupiedBy).toEqual(null);
      expect(testGame.getCell(1, 3).occupiedBy).toEqual("testShip");
    });

    it("moves ships left", () => {
      testGame.moveShip("testShip", Direction.LEFT);
      expect(testGame.getCell(2, 3).occupiedBy).toEqual("testShip");
      const ship = testGame.getShipById("testShip");
      expect(ship.getOrientation()).toEqual(Orientation.EAST);
    });

    it("moves ships right", () => {
      testGame.moveShip("testShip", Direction.RIGHT);
      expect(testGame.getCell(0, 3).occupiedBy).toEqual("testShip");
      const ship = testGame.getShipById("testShip");
      expect(ship.getOrientation()).toEqual(Orientation.WEST);
    });
  });

  // -----------------SHIP MOVEMENT - WITH ROCK COLLISION ----------------
  describe("Ship movement - frontal rock collision", () => {
    let tShip;
    let prevDamage;

    beforeEach(() => {
      testGame = new Game(testMap);
      testGame.addShip("testShip", ShipType.WAR_FRIG, 1, 3, "DEFENDER");
      testGame.getShipById("testShip").setOrientation(Orientation.SOUTH);
      tShip = testGame.getShipById("testShip");
      prevDamage = tShip.damage;
    });

    it("forward move", () => {
      testGame.moveShip("testShip", Direction.FORWARD);
      expect(testGame.getCell(1, 3).occupiedBy).toEqual("testShip");

      expect(tShip.damage).toBe(prevDamage + tShip.shipType.rockDamage);
    });

    it("left move", () => {
      testGame.moveShip("testShip", Direction.LEFT);
      expect(testGame.getCell(1, 3).occupiedBy).toEqual("testShip");
      const ship = testGame.getShipById("testShip");
      expect(ship.boardX).toBe(1);
      expect(ship.boardY).toBe(3);
      expect(ship.getOrientation()).toEqual(Orientation.EAST);

      expect(tShip.damage).toBe(prevDamage + tShip.shipType.rockDamage);
    });

    it("right move", () => {
      testGame.moveShip("testShip", Direction.RIGHT);
      expect(testGame.getCell(1, 3).occupiedBy).toEqual("testShip");
      const ship = testGame.getShipById("testShip");
      expect(ship.boardX).toBe(1);
      expect(ship.boardY).toBe(3);
      expect(ship.getOrientation()).toEqual(Orientation.WEST);

      expect(tShip.damage).toBe(prevDamage + tShip.shipType.rockDamage);
    });
  });
});
