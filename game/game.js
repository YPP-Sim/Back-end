const JobberQuality = require("./JobberQuality");
const GameStatus = require("./GameStatus");

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

  /**
   *  Set's the quality of the jobbers
   * @param {JobberQuality} jobberQuality
   */
  setJobberQuality(jobberQuality) {
    this.jobberQuality = jobberQuality;
  }

  start() {}
}

module.exports = Game;
