const JobberQuality = require("./JobberQuality");
const GameStatus = require("./GameStatus");
const Direction = require("./Direction");
const PlayerMoves = require("./moves/PlayerMoves");
const PlayerData = require("./PlayerData");
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
  constructor(
    map = defaultMap,
    jobberQuality = JobberQuality.ELITE,
    gameId,
    io,
    mapName,
    maxPlayers,
    locked,
    password = ""
  ) {
    this.maxPlayers = maxPlayers;
    this.gameId = gameId;
    this.mapName = mapName;
    this.players = {};
    this.attackers = {};
    this.defenders = {};
    this.map = getFreshMapGrid(map);
    this.jobberQuality = jobberQuality;

    this.io = io;
    this.password = password;
    this.locked = locked;
    this.defenderScore = 0;
    this.attackerScore = 0;

    this.timeLeft = 0;
    this.turnTime = 35; // in seconds

    this.gameStatus = GameStatus.WAITING;

    this.currentGameMoves = {};
    this.claimedToClear = [];

    this.rammedShipsPerTurn = [];
  }

  /**
   * @param {string} id
   * @param {shipType} shipType
   * @param {number} x
   * @param {number} y
   * @param {string} teamType
   * @returns {PlayerShip} the ship that we're adding
   */
  addShip(id, shipType, x, y, teamType) {
    const playerShip = new PlayerShip(id, shipType);
    const cell = this.map[y][x];
    cell.occupiedBy = id;
    playerShip.boardX = x;
    playerShip.boardY = y;
    this.players[id].ship = playerShip;

    if (teamType === "ATTACKER") {
      this.attackers[id] = playerShip;
    } else if (teamType === "DEFENDER") {
      this.defenders[id] = playerShip;
    }

    return playerShip;
  }

  addPlayer(playerName, ship = null) {
    this.players[playerName] = new PlayerData(playerName, ship);
  }

  getPlayerListString() {
    return Object.keys(this.players);
  }

  getPlayerList() {
    return Object.values(this.players);
  }

  removePlayer(playerName) {
    if (this.players[playerName]) delete this.players[playerName];
  }

  getPlayer(playerName) {
    return this.players[playerName];
  }

  addAttacker(playerName) {
    if (!this.attackers[playerName])
      this.attackers[playerName] = this.getPlayer(playerName);
  }

  getAttackers() {
    return Object.values(this.attackers);
  }

  isUndecided(playerName) {
    return (
      !this.attackers[playerName] &&
      !this.defenders[playerName] &&
      this.players[playerName]
    );
  }

  removeAttacker(playerName) {
    if (this.attackers[playerName]) delete this.attackers[playerName];
  }

  addDefender(playerName) {
    if (!this.defenders[playerName])
      this.defenders[playerName] = this.getPlayer(playerName);
  }

  getDefenders() {
    return Object.values(this.defenders);
  }

  removeDefender(playerName) {
    if (this.defenders[playerName]) delete this.defenders[playerName];
  }

  isDefender(playerName) {
    return this.defenders[playerName];
  }

  isAttacker(playerName) {
    return this.attackers[playerName];
  }

  setShipPosition(shipId, x, y) {
    this.getShipById(shipId).boardX = x;
    this.getShipById(shipId).boardY = y;

    const cell = this.getCell(x, y);
    cell.occupiedBy = shipId;
  }

  /**
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

  /**
   * @param {string} id
   * @param {Direction} direction
   * @param {Move} moveObject
   */
  moveShip(id, moveObject) {
    if (!moveObject) return;
    const { direction } = moveObject;
    const ship = this.getShipById(id);
    const toOrientation = getToOrientation(ship.getOrientation(), direction);

    if (!moveObject.cancelledMovement) {
      const ship = this.getShipById(id);

      const frontX = ship.boardX + ship.getOrientation().xDir;
      const frontY = ship.boardY + ship.getOrientation().yDir;

      const prevCell = this.getCell(ship.boardX, ship.boardY);

      prevCell.occupiedBy = null;
      this.getCell(frontX, frontY).occupiedBy = id;
      ship.boardX = frontX;
      ship.boardY = frontY;

      if (direction !== Direction.FORWARD && !moveObject.cancelledTurnal) {
        const turnX = frontX + ship.getOrientation()[direction.toLowerCase()].x;
        const turnY = frontY + ship.getOrientation()[direction.toLowerCase()].y;

        this.getCell(turnX, turnY).occupiedBy = id;
        ship.boardX = turnX;
        ship.boardY = turnY;
      }
    }

    ship.setOrientation(toOrientation);
  }

  /**
   * @param {Move} moveObj
   */
  moveClaim(moveObj) {
    if (!moveObj) return;
    const { direction, moveOwner } = moveObj;
    const ship = this.getShipById(moveOwner);

    const frontX = ship.boardX + ship.getOrientation().xDir;
    const frontY = ship.boardY + ship.getOrientation().yDir;

    // Check for border/out of map collision
    if (this.isOutOfBounds(frontX, frontY)) {
      ship.ramRocks();
      moveObj.cancelledMovement = true;
      return;
    }

    const frontCell = this.getCell(frontX, frontY);

    if (isRock(frontCell.cell_id)) {
      ship.ramRocks();
      moveObj.cancelledMovement = true;
      return;
    }

    frontCell.claiming.push({ id: moveOwner, claimedPriority: 1 });
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

    if (this.isOutOfBounds(turnX, turnY)) {
      ship.ramRocks();
      moveObj.cancelledTurnal = true;
      return;
    }

    const turnedCell = this.getCell(turnX, turnY);

    if (isRock(turnedCell.cell_id)) {
      ship.ramRocks();
      moveObj.cancelledTurnal = true;
      return;
    }

    turnedCell.claiming.push({ id: ship.shipId, claimedPriority: 2 });
    this.claimedToClear.push(turnedCell);

    moveObj.claimedCells.push({ cell: turnedCell, claimedPriority: 2 });
  }

  isOutOfBounds(x, y) {
    return x < 0 || y < 0 || x >= this.map[0].length || y >= this.map.length;
  }

  /**
   * @param {Array.<PlayerMoves>} playerMoves
   */
  _handleClaims(playerMoves, turn) {
    for (let pMoves of playerMoves) {
      const move = pMoves[turn];
      this._handleClaimPerMove(move);
    }

    this.rammedShipsPerTurn = [];
    for (let claimedCell of this.claimedToClear) {
      claimedCell.claiming = [];
    }
  }

  _handleClaimPerMove(move) {
    if (move) {
      if (!move.direction) return;
      if (move.claimedCells.length === 0) return;

      let firstCell;
      let secondCell;
      firstCell = move.claimedCells[0].cell;

      if (move.claimedCells.length > 1) {
        secondCell = move.claimedCells[1].cell;
      }

      this._handleCellClaimWithPrio(firstCell, 1, move, false);
      if (!move.cancelledMovement && secondCell)
        this._handleCellClaimWithPrio(secondCell, 2, move, true);
    }
  }

  _handleCellClaimWithPrio(cell, priority, move, turnal) {
    const { moveOwner } = move;

    for (let claimObj of cell.claiming) {
      const { id, claimedPriority } = claimObj;
      if (id == moveOwner) continue;
      if (claimedPriority <= priority) {
        if (!this._rammedThisTurn(id, moveOwner)) {
          this.getShipById(id).ramShip(this.getShipById(moveOwner));
          this.rammedShipsPerTurn.push([id, moveOwner]);
        }
        if (turnal) {
          move.cancelledTurnal = true;
        } else {
          move.cancelledMovement = true;
        }
      }
    }
  }

  _rammedThisTurn(shipId, otherId) {
    for (let ramPair of this.rammedShipsPerTurn)
      if (ramPair.includes(shipId) && ramPair.includes(otherId)) return true;

    return false;
  }

  /**
   * @param {*} dir
   * @param {PlayerShip} ship
   * @param {number} frontX
   * @param {number} frontY
   * @param {*} prevCell
   */
  _moveTurn(dir, ship, frontX, frontY, prevCell) {
    const turnX = frontX + ship.getOrientation()[dir].x;
    const turnY = frontY + ship.getOrientation()[dir].y;

    const toOrientation = getToOrientation(
      ship.getOrientation(),
      dir.toUpperCase()
    );

    ship.setOrientation(toOrientation);

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
   * @param {String} id
   * @returns {PlayerShip} the ship that was retrieved through the id.
   */
  getShipById(id) {
    return this.players[id].ship;
  }

  onGameTurn() {
    // TODO - Get all of the clients moves
    // TODO - Play out moves and calculate the damage taken to any ships and set new board based off ship moves.
    // TODO - Send out data to clients for them to visually show moves
    this.io.in(this.gameId).emit("gameTurn", "We're doing a game turn!");
  }

  onGameTick() {
    this.turnTick++;
    // send the current turn tick to all the clients
    this.io.in(this.gameId).emit("gameTick", this.turnTick);
    if (this.turnTick === this.turnTime) {
      this.onGameTurn();
      this.turnTick = 0;
    }
  }

  /**
   *
   * @param {Array.<PlayerMoves>} playerMoves
   */
  executeMoves(playerMoves) {
    const executeClaimsAndMove = (turn) => {
      // Get and calculate claims
      for (let pMove of playerMoves) {
        this.moveClaim(pMove[turn]);
      }

      // Handle claims
      this._handleClaims(playerMoves, turn);

      // Move the ships
      for (let plMove of playerMoves) {
        this.moveShip(plMove.shipId, plMove[turn]);
      }
    };

    executeClaimsAndMove("firstMove");
    executeClaimsAndMove("secondMove");
    executeClaimsAndMove("thirdMove");
    executeClaimsAndMove("fourthMove");
  }

  /**
   *  Set's the quality of the jobbers
   * @param {JobberQuality} jobberQuality
   */
  setJobberQuality(jobberQuality) {
    this.jobberQuality = jobberQuality;
  }

  getStatus() {
    return this.gameStatus;
  }

  start() {
    // TODO - Set ships locations to their respective sides (attacking/defending)

    // TODO - Tell client the game has started, send out starting data to client.
    this.gameStatus = GameStatus.INGAME;

    this.turnTick = 0;
    this.gameIntervalId = setInterval(() => {
      this.onGameTick();
    }, 1000);
  }

  stop() {
    clearInterval(this.gameIntervalId);
    this.gameStatus = GameStatus.ENDED;
  }
}

module.exports = Game;
