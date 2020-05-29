const JobberQuality = require("./JobberQuality");
const GameStatus = require("./GameStatus");
const Direction = require("./Direction");
const PlayerMoves = require("./moves/PlayerMoves");
const PlayerShip = require("./PlayerShip");
const Orientation = require("./Orientation");
const { getFreshMapGrid, isRock } = require("./util");

const defaultMap = [
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 2, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 13, 0, 11, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 0, 14, 0, 10, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [3, 7, 8, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 6, 5, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [15, 0, 0, 0, 4, 4, 4, 4, 4, 4, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0],
];

/**
 *
 * @param {Orientation} startingOrientation
 * @param {Direction} direction
 * @returns {Orientation} the new orientation from the direction taken
 */
function getToOrientation(startingOrientation, direction) {
  switch (direction) {
    case Direction.LEFT:
      switch (startingOrientation) {
        case Orientation.NORTH:
          return Orientation.WEST;
        case Orientation.SOUTH:
          return Orientation.EAST;
        case Orientation.EAST:
          return Orientation.NORTH;
        case Orientation.WEST:
          return Orientation.SOUTH;
      }

      break;

    case Direction.RIGHT:
      switch (startingOrientation) {
        case Orientation.NORTH:
          return Orientation.EAST;
        case Orientation.SOUTH:
          return Orientation.WEST;
        case Orientation.EAST:
          return Orientation.SOUTH;
        case Orientation.WEST:
          return Orientation.NORTH;
      }

      break;

    default:
      return startingOrientation;
  }
}

class Game {
  constructor(map = defaultMap, jobberQuality = JobberQuality.ELITE) {
    this.players = {};
    this.attackers = {};
    this.defenders = {};

    this.map = getFreshMapGrid(map);
    this.jobberQuality = jobberQuality;

    this.defenderScore = 0;
    this.attackerScore = 0;

    this.timeLeft = 0;
    this.turnTime = 20; // in seconds

    this.gameStatus = GameStatus.LOBBY;
  }

  addShip(id, shipType, x, y, teamType) {
    const playerShip = new PlayerShip(id, shipType);
    const cell = this.map[y][x];
    cell.occupiedBy = id;
    playerShip.boardX = x;
    playerShip.boardY = y;
    this.players[id] = playerShip;

    if (teamType === "ATTACKER") {
      this.attackers[id] = playerShip;
    } else if (teamType === "DEFENDER") {
      this.defenders[id] = playerShip;
    }
  }

  /**
   *
   * @param {number} amount
   */
  addAttackerScore(amount) {
    this.attackerScore += amount;
  }

  /**
   *
   * @param {number} amount
   */
  addDefenderScore(amount) {
    this.defenderScore += amount;
  }

  isDefender(playerId) {
    for (let p in this.defenders) if (p === playerId) return true;
    return false;
  }

  isAttacker(playerId) {
    for (let p in this.attackers) if (p === playerId) return true;
    return false;
  }

  getCell(x, y) {
    return this.map[y][x];
  }

  moveShip(id, direction) {
    const ship = this.getShipById(id);

    const frontX = ship.boardX + ship.getOrientation().xDir;
    const frontY = ship.boardY + ship.getOrientation().yDir;

    // console.log("Ship.boardX: " + ship.boardX);
    // console.log("shipOrient: " + ship.getOrientation);

    const prevCell = this.getCell(ship.boardX, ship.boardY);

    // console.log("frontX: ", frontY, "frontY: ", frontY);
    switch (direction) {
      case Direction.FORWARD:
        // If we're going out of bounds, contain and do ram damage.
        if (frontX < 0 || frontY < 0) {
          // TODO - Damage ship by ram damage.
          return;
        }

        const cell = this.getCell(frontX, frontY);

        if (isRock(cell.cell_id)) {
          // TODO - Damage ship by ram damage.
          return;
        }

        if (cell.occupiedBy) {
          const occupiedShip = cell.occupiedBy;

          // Check if occupied cell's ship has a move on the same turn, in case of tortoise/hare situation.

          // Cell is being occupied by another ship
          // TODO - ram damage to both ships.

          // TODO - Since it's a forward move, don't move original ship but move the rammed ship back by one
          // Relative to the orientation this ship is facing
          return;
        }

        // Free passing
        prevCell.occupiedBy = null;
        this.getCell(frontX, frontY).occupiedBy = id;

        ship.boardX = frontX;
        ship.boardY = frontY;

        break;
      case Direction.LEFT:
        this._moveTurn("left", ship, frontX, frontY, prevCell);
        break;
      case Direction.RIGHT:
        this._moveTurn("right", ship, frontX, frontY, prevCell);
        break;
    }
  }

  _moveTurn(dir, ship, frontX, frontY, prevCell) {
    const turnX = frontX + ship.getOrientation()[dir].x;
    const turnY = frontY + ship.getOrientation()[dir].y;

    // ship.setOrientation(ship.getOrientation()[dir].toOrientation);

    const toOrientation = getToOrientation(
      ship.getOrientation(),
      dir.toUpperCase()
    );

    ship.setOrientation(toOrientation);

    // Detect frontal collisions
    if (this._collisionDetect(frontX, frontY)) {
      // TODO - Do ram damage ( Don't forget other ship ram as well)
      return;
    }

    // Detect turn collisions
    if (this._collisionDetect(turnX, turnY)) {
      // TODO - Do ram damage (Don't forget other ship ram as well)

      // Move forward.
      prevCell.occupiedBy = null;
      this.getCell(frontX, frontY).occupiedBy = ship.shipId;

      ship.boardX = frontX;
      ship.boardY = frontY;
      return;
    }

    // Free passing
    prevCell.occupiedBy = null;
    this.getCell(turnX, turnY).occupiedBy = ship.shipId;

    ship.boardX = turnX;
    ship.boardY = turnY;
  }

  _collisionDetect(x, y) {
    return (
      x < 0 ||
      y < 0 ||
      isRock(this.getCell(x, y).cell_id) ||
      this.getCell(x, y).occupiedBy
    );
  }

  /**
   *
   * @param {String} id
   * @returns {PlayerShip} the ship that was retrieved through the id.
   */
  getShipById(id) {
    return this.players[id];
  }

  onGameTurn() {
    // TODO - Get all of the clients moves
    // TODO - Play out moves and calculate the damage taken to any ships and set new board based off ship moves.
    this.calculateTurns();
    // TODO - Send out data to clients for them to visually show moves
  }

  /**
   *  Will take an array of objects where each object contains the id of the player ship,
   *  and the moves that it will be performing. If there is no object of data for a player on the board,
   * that player will not move.
   * @param {Array.<PlayerMoves>} playerMoves
   */
  calculateTurns(playerMoves) {
    // Calculate first turn movement.
    for (let moveData of playerMoves) {
      const shipId = moveData.shipId;
    }
  }

  /**
   *  Set's the quality of the jobbers
   * @param {JobberQuality} jobberQuality
   */
  setJobberQuality(jobberQuality) {
    this.jobberQuality = jobberQuality;
  }

  start() {
    // TODO - Set ships locations to their respective sides (attacking/defending)

    // TODO - Tell client the game has started, send out starting data to client.
    this.gameStatus = GameStatus.INGAME;

    this.gameIntervalId = setInterval(() => {
      this.onGameTurn();
    }, this.turnTime);
  }

  stop() {
    clearInterval(this.gameIntervalId);
    this.gameStatus = GameStatus.ENDED;
  }
}

module.exports = Game;
