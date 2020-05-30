const JobberQuality = require("./JobberQuality");
const GameStatus = require("./GameStatus");
const Direction = require("./Direction");
const PlayerMoves = require("./moves/PlayerMoves");
const PlayerShip = require("./PlayerShip");
const Orientation = require("./Orientation");
const Move = require("./moves/Move");
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

    this.currentGameMoves = {};
    this.claimedToClear = [];
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

  moveShip(id, direction, moveObject) {
    const ship = this.getShipById(id);

    const frontX = ship.boardX + ship.getOrientation().xDir;
    const frontY = ship.boardY + ship.getOrientation().yDir;

    const prevCell = this.getCell(ship.boardX, ship.boardY);

    switch (direction) {
      case Direction.FORWARD:
        // If we're going out of bounds, contain and do ram damage.
        if (frontX < 0 || frontY < 0) {
          ship.ramRocks();
          return;
        }

        const cell = this.getCell(frontX, frontY);

        if (isRock(cell.cell_id)) {
          ship.ramRocks();
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
        // prevCell.occupiedBy = null;
        // this.getCell(frontX, frontY).occupiedBy = id;

        // ship.boardX = frontX;
        // ship.boardY = frontY;
        const frontCell = this.getCell(frontX, frontY);
        frontCell.claiming.push({ id, claimedPriority: 1 });
        this.claimedToClear.push(frontCell);
        moveObject.claimedCells.push({ cell: frontCell, claimedPriority: 1 });
        break;
      case Direction.LEFT:
        this._moveTurn("left", ship, frontX, frontY, prevCell);
        break;
      case Direction.RIGHT:
        this._moveTurn("right", ship, frontX, frontY, prevCell);
        break;
    }
  }

  firstPassClaimMoves() {}

  moveClaim(id, direction, moveObj) {
    const ship = this.getShipById(id);

    const frontX = ship.boardX + ship.getOrientation().xDir;
    const frontY = ship.boardY + ship.getOrientation().yDir;

    const frontCell = this.getCell(frontX, frontY);

    frontCell.claiming.push({ id, claimedPriority: 1 });
    this.claimedToClear.push(frontCell);
    moveObj.claimedCells.push({ cell: frontCell, claimedPriority: 1 });

    switch (direction) {
      case Direction.LEFT:
      case Direction.RIGHT:
        this._turnClaim(ship, frontX, frontY, direction, moveObj);
        break;
    }
  }

  _turnClaim(ship, frontX, frontY, dir, moveObj) {
    dir = dir.toLowerCase();
    const turnX = frontX + ship.getOrientation()[dir].x;
    const turnY = frontY + ship.getOrientation()[dir].y;

    const turnedCell = this.getCell(turnX, turnY);
    turnedCell.claiming.push({ id: ship.shipId, claimedPriority: 2 });
    this.claimedToClear.push(turnedCell);

    moveObj.claimedCells.push({ cell: turnedCell, claimedPriority: 2 });
  }

  /**
   *
   * @param {Array.<PlayerMoves>} playerMoves
   */
  _handleClaims(playerMoves) {
    // Handle first turn
    for (let pMoves of playerMoves) {
      const firstMove = pMoves.firstMove;

      if (firstMove) {
        if (!firstMove.direction) continue;

        let firstCell;
        let secondCell;
        firstCell = firstMove.claimedCells[0];

        if (firstMove.claimedCells.length > 1) {
          secondCell = firstMove.claimedCells[1];
        }

        for (let claimObj of firstCell.claiming) {
          const { id, claimedPriority } = claimObj;
          if (id == firstMove.moveOwner) continue;

          switch (firstMove.direction) {
            case Direction.FORWARD:
              break;
            default:
              break;
          }
        }
      }
    }
  }

  /**
   *
   * @param {Move} move
   */
  isMovePrioritized(move) {
    let ourPriority;

    for (let claiming of move.claimedCell.claiming) {
      const { id, claimedPriority } = claiming;
    }
  }

  /**
   *
   * @param {*} dir
   * @param {PlayerShip} ship
   * @param {number} frontX
   * @param {number} frontY
   * @param {*} prevCell
   */
  _moveTurn(dir, ship, frontX, frontY, prevCell) {
    const turnX = frontX + ship.getOrientation()[dir].x;
    const turnY = frontY + ship.getOrientation()[dir].y;

    // ship.setOrientation(ship.getOrientation()[dir].toOrientation);

    const toOrientation = getToOrientation(
      ship.getOrientation(),
      dir.toUpperCase()
    );

    ship.setOrientation(toOrientation);

    // Detect frontal rock collision
    if (this._rockCollisionDetect(frontX, frontY)) {
      ship.ramRocks();
      return;
    }

    // Detect turn rock collisions
    if (this._rockCollisionDetect(turnX, turnY)) {
      ship.ramRocks();
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

  _rockCollisionDetect(x, y) {
    return x < 0 || y < 0 || isRock(this.getCell(x, y).cell_id);
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
    this.currentGameMoves = playerMoves;

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
