const JobberQuality = require("./JobberQuality");
const GameStatus = require("./GameStatus");
const Direction = require("./Direction");
const PlayerMoves = require("./moves/PlayerMoves");
const PlayerData = require("./PlayerData");
const PlayerShip = require("./PlayerShip");
const Orientation = require("./Orientation");
const Move = require("./moves/Move");
const {
  getFreshMapGrid,
  isRock,
  isActionableDirection,
  defaultMap,
  getWindTypeById,
  isTallRock,
} = require("./util");
const util = require("./util");
const WindType = require("./WindType");

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
    password = "",
    gameOwner
  ) {
    this.maxPlayers = maxPlayers;
    this.gameId = gameId;
    this.mapName = mapName;
    this.gameOwner = gameOwner;
    this.players = {};
    this.attackers = {};
    this.defenders = {};
    util.readMapFromFile(mapName).then((rawMap) => {
      this.rawMap = util.addSafeZone(rawMap);
    });
    this.map = getFreshMapGrid(map);
    this.jobberQuality = jobberQuality;

    this.io = io;
    this.password = password;
    this.locked = locked;
    this.defenderScore = 0;
    this.attackerScore = 0;

    this.timeLeft = 0;
    this.turnTime = 20; // in seconds

    this.gameStatus = GameStatus.WAITING;

    this.currentGameMoves = {};
    this.claimedToClear = [];

    this.rammedShipsPerTurn = [];

    this.cannonRange = 3;

    this.sinking = [];
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
    const playerShip = new PlayerShip(id, shipType, teamType, this);
    const cell = this.map[y][x];
    cell.occupiedBy = id;
    playerShip.boardX = x;
    playerShip.boardY = y;

    if (!this.players[id]) {
      this.addPlayer(id);
    }
    this.players[id].ship = playerShip;

    if (teamType === "ATTACKER") {
      this.attackers[id] = playerShip;
      2;
    } else if (teamType === "DEFENDER") {
      this.defenders[id] = playerShip;
    }

    return playerShip;
  }

  addPlayer(playerName, ship = null) {
    this.players[playerName] = new PlayerData(playerName, ship);
  }

  getPlayerById(playerName) {
    return this.players[playerName];
  }

  getPlayerListString() {
    return Object.keys(this.players);
  }

  getPlayerList() {
    return Object.values(this.players);
  }

  removePlayer(playerName) {
    if (this.players[playerName]) delete this.players[playerName];
    this.removeAttacker(playerName);
    this.removeDefender(playerName);
  }

  /**
   *
   * @param {string} playerName the player to get by name
   * @returns {PlayerData} the player data
   */
  getPlayer(playerName) {
    return this.players[playerName];
  }

  addAttacker(playerName) {
    if (!this.attackers[playerName]) {
      if (!this.getPlayer(playerName)) {
        this.addPlayer(playerName);
      }
      this.attackers[playerName] = this.getPlayer(playerName);
    }
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
    if (!this.defenders[playerName]) {
      if (!this.getPlayer(playerName)) {
        this.addPlayer(playerName);
      }
      this.defenders[playerName] = this.getPlayer(playerName);
    }
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
    const ship = this.getShipById(shipId);

    // Remove previous cell occupiedBy
    const cellToRemove = this.getCell(ship.boardX, ship.boardY);
    cellToRemove.occupiedBy = null;

    ship.boardX = x;
    ship.boardY = y;

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
    if (x < 0 || y < 0 || y >= this.map.length || x >= this.map[0].length)
      return null;
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
    if (!direction) return;
    const ship = this.getShipById(id);
    if (!ship) return;
    if (ship.sinking) return;

    const toOrientation = getToOrientation(ship.getOrientation(), direction);

    if (!moveObject.cancelledMovement) {
      const ship = this.getShipById(id);

      const frontX = ship.boardX + ship.getOrientation().xDir;
      const frontY = ship.boardY + ship.getOrientation().yDir;

      let prevCell = this.getCell(ship.boardX, ship.boardY);

      prevCell.occupiedBy = null;
      let currentCell = this.getCell(frontX, frontY);
      currentCell.occupiedBy = id;
      ship.boardX = frontX;
      ship.boardY = frontY;

      prevCell = currentCell;
      if (direction !== Direction.FORWARD && !moveObject.cancelledTurnal) {
        const turnX = frontX + ship.getOrientation()[direction.toLowerCase()].x;
        const turnY = frontY + ship.getOrientation()[direction.toLowerCase()].y;

        currentCell = this.getCell(turnX, turnY);
        currentCell.occupiedBy = id;
        prevCell.occupiedBy = null;

        ship.boardX = turnX;
        ship.boardY = turnY;
      }
    }

    ship.setOrientation(toOrientation);
  }

  /**
   * @param {Move} moveObj
   */
  moveClaim(moveObj, shipId) {
    const ship = this.getShipById(shipId);
    if (!ship) return;
    if (ship.sinking) return;

    if (!moveObj || moveObj.direction === Direction.STALL || ship.sinking) {
      const stationaryCell = this.getCell(ship.boardX, ship.boardY);

      stationaryCell.claiming.push({ id: shipId, claimedPriority: 1 });
      this.claimedToClear.push(stationaryCell);
      // moveObj.claimedCells.push({ cell: stationaryCell, claimedPriority: 1 });

      return;
    }

    // if (!moveObj) return;
    const { direction, moveOwner } = moveObj;
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
  _handleClaims(playerMoves, turn, numberedTurn) {
    for (let pMoves of playerMoves) {
      const move = pMoves[turn];
      this._handleClaimPerMove(move, numberedTurn);
    }

    this.rammedShipsPerTurn = [];
    for (let claimedCell of this.claimedToClear) {
      claimedCell.claiming = [];
    }
  }

  _handleClaimPerMove(move, numberedTurn) {
    if (move) {
      if (!move.direction) return;
      if (move.claimedCells.length === 0) return;

      let firstCell;
      let secondCell;
      firstCell = move.claimedCells[0].cell;

      if (move.claimedCells.length > 1) {
        secondCell = move.claimedCells[1].cell;
      }

      this._handleCellClaimWithPrio(
        firstCell,
        1,
        move,
        false,
        false,
        numberedTurn
      );
      if (!move.cancelledMovement && secondCell)
        this._handleCellClaimWithPrio(
          secondCell,
          2,
          move,
          true,
          false,
          numberedTurn
        );
    }
  }

  _handleCellClaimWithPrio(
    cell,
    priority,
    move,
    turnal,
    windClaim,
    numberedTurn
  ) {
    const { moveOwner } = move;

    for (let claimObj of cell.claiming) {
      const { id, claimedPriority } = claimObj;

      //Handle stationary ship collisions

      // Handle multiple claims
      if (id == moveOwner) continue;
      if (claimedPriority <= priority) {
        if (!this._rammedThisTurn(id, moveOwner)) {
          this.getShipById(id).ramShip(
            this.getShipById(moveOwner),
            numberedTurn
          );
          this.rammedShipsPerTurn.push([id, moveOwner]);
        }
        if (turnal) {
          if (windClaim) move.windTypeMovement.cancelledTurnal = true;
          else move.cancelledTurnal = true;
        } else {
          if (windClaim) move.windTypeMovement.cancelledMovement = true;
          else move.cancelledMovement = true;
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
    if (!this.players[id]) return null;
    return this.players[id].ship;
  }

  getAllPlayerMovements() {
    const playerMovements = {
      turn_1: [],
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
    };
    this._loadTurn(playerMovements, 1, "firstMove");
    this._loadTurn(playerMovements, 2, "secondMove");
    this._loadTurn(playerMovements, 3, "thirdMove");
    this._loadTurn(playerMovements, 4, "fourthMove");
    return playerMovements;
  }

  _loadTurn(playerMovements, numberedTurn, namedTurn) {
    for (let playerName in this.players) {
      const player = this.players[playerName];
      if (!player) continue;
      const pMoves = player.moves;
      if (!pMoves || !pMoves[namedTurn]) continue;

      const ship = player.getShip();
      if (ship.sinking && numberedTurn > ship.sunkOnTurn) continue;

      const move = pMoves[namedTurn];
      const { direction, cancelledMovement, cancelledTurnal } = move;

      if (isActionableDirection(direction)) {
        playerMovements["turn_" + numberedTurn].push({
          playerName,
          direction,
          cancelledTurnal,
          cancelledMovement,
        });
      }
    }
  }

  _fillShotDataPerTurn(playerMovements, numberedTurn, namedTurn) {
    for (let playerName in this.players) {
      const player = this.players[playerName];
      if (!player) continue;
      const pMoves = player.moves;
      if (!pMoves || !pMoves[namedTurn]) continue;

      const move = pMoves[namedTurn];
      const {
        rightGuns,
        leftGuns,
        rightGunEnd,
        leftGunEnd,
        leftHit,
        rightHit,
      } = move;
      if (move.rightGuns[0] || move.leftGuns[0]) {
        playerMovements["turn_" + numberedTurn + "_shots"].push({
          playerName,
          rightGuns,
          rightGunEnd,
          leftGuns,
          leftGunEnd,
          leftHit,
          rightHit,
        });
      }
    }
  }

  _fillShotData(playerMovements) {
    this._fillShotDataPerTurn(playerMovements, 1, "firstMove");
    this._fillShotDataPerTurn(playerMovements, 2, "secondMove");
    this._fillShotDataPerTurn(playerMovements, 3, "thirdMove");
    this._fillShotDataPerTurn(playerMovements, 4, "fourthMove");
  }

  _fillWindData(playerMovements) {
    this._fillWindDataPerTurn(playerMovements, 1, "firstMove");
    this._fillWindDataPerTurn(playerMovements, 2, "secondMove");
    this._fillWindDataPerTurn(playerMovements, 3, "thirdMove");
    this._fillWindDataPerTurn(playerMovements, 4, "fourthMove");
  }

  _fillWindDataPerTurn(playerMovements, numberedTurn, namedTurn) {
    for (let playerName in this.players) {
      const player = this.players[playerName];
      if (!player) continue;
      const pMoves = player.moves;
      if (!pMoves || !pMoves[namedTurn]) continue;

      const move = pMoves[namedTurn];
      const { windTypeMovement } = move;
      if (windTypeMovement) {
        playerMovements["turn_" + numberedTurn + "_winds"].push({
          playerName,
          windType: windTypeMovement,
        });
      }
    }
  }

  _fillSinkData(playerMovements) {
    for (let playerName in this.players) {
      const player = this.players[playerName];
      if (!player) continue;

      if (!player.ship) return;
      const sunkOnTurn = player.ship.sunkOnTurn;

      if (sunkOnTurn > 0) {
        this.sinking.push(player.ship);
        playerMovements["turn_" + sunkOnTurn + "_sinks"].push({
          playerName,
        });
      }
    }
  }

  onGameTurn() {
    const allPMoves = [];
    for (let playerName in this.players)
      allPMoves.push(this.players[playerName].moves);

    this.executeMoves(allPMoves);
    const playerMovements = this.getAllPlayerMovements();
    this._fillWindData(playerMovements);
    this._fillShotData(playerMovements);
    this._fillSinkData(playerMovements);

    const playerData = this.getAllPlayerPositions();
    this.io.in(this.gameId).emit("gameTurn", { playerMovements, playerData });

    this.resetSunkShips();
    setTimeout(() => {
      this.io.in(this.gameId).emit("clearShips", "yeah");
      this.clearAllMoves();
    }, 3500);
  }

  resetSunkShips() {
    for (let ship of this.sinking) {
      setTimeout(() => {
        ship.bilge = 0;
        ship.damage = 0;
        ship.sinking = false;
        ship.sunkOnTurn = 0;
        this.setRandomSpawn(ship);

        const eventObj = {
          shipId: ship.shipId,
          boardX: ship.boardX,
          boardY: ship.boardY,
          orientation: ship.getOrientation().name,
        };

        this.io.in(this.gameId).emit("shipPositionChange", eventObj);
      }, 5000 + 3000 * ship.sunkOnTurn);
    }

    this.sinking = [];
  }

  clearAllMoves() {
    for (let playerName in this.players) {
      this.players[playerName].moves.clear();
    }
  }

  getAllPlayerPositions() {
    const playersData = [];
    for (let playerName in this.players) {
      const player = this.players[playerName];
      if (player && player.ship)
        playersData.push({
          playerName,
          boardX: player.ship.boardX,
          boardY: player.ship.boardY,
          orientation: player.ship.getOrientation().name,
        });
    }
    return playersData;
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
    const executeClaimsAndMove = (turn, numberedTurn) => {
      // Get and calculate claims
      for (let pMove of playerMoves) {
        this.moveClaim(pMove[turn], pMove.shipId);
      }

      // Handle claims
      this._handleClaims(playerMoves, turn, numberedTurn);
      this.claimedToClear = [];

      // Move the ships
      for (let plMove of playerMoves) {
        const move = plMove[turn];
        this.moveShip(plMove.shipId, move);
      }

      // Handle wind moves after ship movement
      this._handleWinds(turn);

      // Fire the cannons
      this.executeCannonShots(turn, playerMoves, numberedTurn);
    };

    executeClaimsAndMove("firstMove", 1);
    executeClaimsAndMove("secondMove", 2);
    executeClaimsAndMove("thirdMove", 3);
    executeClaimsAndMove("fourthMove", 4);
  }

  _handleWinds(turn) {
    // Claim cells that the winds push the ships into
    for (let player of this.getPlayerList()) {
      const ship = player.getShip();
      if (!ship) continue;

      this._windClaim(ship, turn);
    }

    // Consume the claims, and move ships, handle collisions/etc.
    for (let player of this.getPlayerList()) {
      const ship = player.getShip();
      if (!ship) continue;

      this._handleWindClaim(ship, turn);
    }

    for (let player of this.getPlayerList()) {
      const ship = player.getShip();
      if (!ship) continue;

      this._windMove(ship, turn);
    }

    this.rammedShipsPerTurn = [];
    for (let claimedCell of this.claimedToClear) {
      claimedCell.claiming = [];
    }
  }

  _handleWindClaim(ship, turn) {
    if (ship.sinking) return;
    const player = this.getPlayerById(ship.shipId);
    if (!player) return;

    const pMoves = player.getMoves();
    if (!pMoves) return;

    const move = pMoves[turn];

    if (!move) return;
    if (!move.windTypeMovement) return;
    if (!move.claimedCells || move.claimedCells.length === 0) return;

    const firstCell = move.claimedCells[0];
    let secondCell;

    if (move.claimedCells.length === 2) {
      secondCell = move.claimedCells[1];
    }

    this._handleCellClaimWithPrio(firstCell, 1, move, false, true);

    if (!move.cancelledMovement && secondCell)
      this._handleCellClaimWithPrio(secondCell, 2, move, true, true);
  }

  _windMove(ship, turn) {
    if (ship.sinking) return;

    const player = this.getPlayerById(ship.shipId);
    if (!player) return;

    const pMoves = player.getMoves();
    if (!pMoves) return;

    const move = pMoves[turn];

    if (!move) return;

    if (!move.windTypeMovement) return;

    if (move.windTypeMovement.cancelledMovement) return;

    const windType = WindType[move.windTypeMovement.type];
    let direction = windType.direction;

    const toCell1X = ship.boardX + direction.xDir;
    const toCell1Y = ship.boardY + direction.yDir;

    let prevCell = this.getCell(ship.boardX, ship.boardY);
    prevCell.occupiedBy = null;
    let currentCell = this.getCell(toCell1X, toCell1Y);
    currentCell.occupiedBy = ship.shipId;
    ship.boardX = toCell1X;
    ship.boardY = toCell1Y;

    prevCell = currentCell;
    if (windType.turn_direction && !move.windTypeMovement.cancelledTurnal) {
      direction = windType.turn_direction;
      const toCell2X = ship.boardX + direction.xDir;
      const toCell2Y = ship.boardY + direction.yDir;

      currentCell = this.getCell(toCell2X, toCell2Y);
      currentCell.occupiedBy = ship.shipId;
      prevCell.occupiedBy = null;

      ship.boardX = toCell2X;
      ship.boardY = toCell2Y;
    }
  }

  _windClaim(ship, turn) {
    const { boardX, boardY, shipId, sinking } = ship;
    const cell = this.getCell(boardX, boardY);
    if (sinking) return;
    if (this.isWind(cell.cell_id)) {
      //Player landed on a wind cell
      const windType = getWindTypeById(cell.cell_id);

      const player = this.getPlayerById(shipId);

      let move = player.getMoves()[turn];

      if (!move) {
        move = new Move(Direction.STALL, shipId);
        player.getMoves()[turn] = move;
      }

      move.windTypeMovement = {
        type: windType.name,
        cancelledMovement: false,
      };

      move.claimedCells = [];

      const toX1 = boardX + windType.direction.xDir;
      const toY1 = boardY + windType.direction.yDir;

      const toCell1 = this.getCell(toX1, toY1);
      toCell1.claiming.push({ id: shipId, claimedPriority: 1 });
      move.claimedCells.push(toCell1);
      this.claimedToClear.push(toCell1);

      // If this is a whirlwind, we will have a cell to 'turn' into.
      if (windType.turnDirection) {
        const toX2 = toX1 + windType.turnDirection.x;
        const toY2 = toY1 + windType.turnDirection.y;

        const toCell2 = this.getCell(toX2, toY2);
        toCell2.claiming.push({ id: shipId, claimedPriority: 2 });
        this.claimedToClear.push(toCell2);

        move.claimedCells.push(tocell2);
        move.windTypeMovement.cancelledTurnal = false;
      }
    }
  }

  isWind(cellId) {
    switch (cellId) {
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
        return true;
      default:
        return false;
    }
  }

  /**
   * For private use in the "executeCannonShots" function
   *
   * @param {string} cannonSide
   * @param {Move} move
   * @param {PlayerShip} ship
   */
  _calculateCannonSide(cannonSide, move, ship, numberedTurn) {
    // Shoot if there are guns on that side
    if (!move) return;
    if (move[cannonSide + "Guns"][0]) {
      // Detect if there are any ships in range
      for (let i = 0; i < this.cannonRange; i++) {
        // Get cells
        const xIncr = ship.getOrientation()[cannonSide].x * (i + 1);
        const yIncr = ship.getOrientation()[cannonSide].y * (i + 1);
        const toCell = this.getCell(ship.boardX + xIncr, ship.boardY + yIncr);

        if (toCell === null) continue;

        if (toCell.occupiedBy !== null) {
          const hitShip = this.getShipById(toCell.occupiedBy);
          if (hitShip && ship.shipType) {
            let cannonHits = 1;
            if (move[cannonSide + "Guns"].length > 1)
              if (move[cannonSide + "Guns"][1]) cannonHits = 2;

            hitShip.damageShip(
              ship.shipType.cannonType.damage * cannonHits,
              numberedTurn
            );
            move[cannonSide + "GunEnd"] = i + 1;
            move[cannonSide + "Hit"] = true;
            break;
          }
        } else if (isTallRock(toCell.cell_id)) {
          move[cannonSide + "GunEnd"] = i + 1;
          move[cannonSide + "Hit"] = true;
          break;
        }
      }
    }
  }

  executeCannonShots(turn, playerMoves, numberedTurn) {
    for (let pMove of playerMoves) {
      const move = pMove[turn];
      const ship = this.getShipById(pMove.shipId);

      this._calculateCannonSide("left", move, ship, numberedTurn);
      this._calculateCannonSide("right", move, ship, numberedTurn);
    }
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
    this._setRandomSpawns();
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

  setRandomSpawn(ship, attackingSide = true) {
    let rowCount = 0;
    const toOrientation = attackingSide ? Orientation.NORTH : Orientation.SOUTH;

    while (rowCount < 3) {
      const freeCells = getUnoccupiedRowCells(
        attackingSide ? this.map.length - 1 - rowCount : 0 + rowCount,
        this.map
      );
      if (freeCells.length === 0) {
        rowCount++;
        continue;
      }
      const rNum = getRandomInt(freeCells.length);
      freeCells[rNum].occupiedBy = ship.shipId;
      const x = freeCells[rNum].index;
      const y = attackingSide ? this.map.length - 1 - rowCount : 0 + rowCount;

      this.setShipPosition(ship.shipId, x, y);
      ship.setOrientation(toOrientation);
      break;
    }
  }

  _setRandomSpawns() {
    for (let attcker in this.attackers) {
      const att = this.attackers[attcker];
      this.setRandomSpawn(att.getShip());
    }

    for (let defender in this.defenders) {
      const def = this.defenders[defender];
      this.setRandomSpawn(def.getShip(), false);
    }
  }
}
function getUnoccupiedRowCells(row, map) {
  const rowCells = map[row].map((cell, index) => {
    if (cell.occupiedBy) return null;
    cell.index = index;
    return cell;
  });
  const freeCells = rowCells.filter((cell) => cell);

  return freeCells;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

module.exports = Game;
