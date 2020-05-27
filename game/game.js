const JobberQuality = require("./JobberQuality");
const GameStatus = require("./GameStatus");
const PlayerMoves = require("./moves/PlayerMoves");

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

// function isRock(cell_id) {
//   switch (cell_id) {
//     case 13:
//     case 14:
//     case 15:
//     case 16:
//       return true;
//     default:
//       return false;
//   }
// }

function getFreshMapGrid(map) {
  const rows = map.length;
  const columns = map[0].length;

  const detailedMap = map;

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cellData = {
        cell_id: map[row][column],
        occupiedBy: null,
      };
      detailedMap[row][column] = cellData;
    }
  }
  return detailedMap;
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
