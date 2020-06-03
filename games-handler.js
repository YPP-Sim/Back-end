const { getSocketIO } = require("./index");

const Game = require("./game/game");
const JobberQuality = require("./game/JobberQuality");

const games = {};

/**
 * @param {string} id The unique identifier of the game that will be used to retrieve the instance later
 * @param { Array.<Array.<number>>} map The map the game will be using
 * @param { JobberQuality } jobberQuality The quality of jobbers that everyone will get by default
 */
function createGame(id, map, jobberQuality) {
  if (games[id]) throw `Game with id '${id}' already exists`;

  const newGame = new Game(
    map,
    jobberQuality,
    id,
    getSocketIO().sockets.in(id.toString())
  );

  games[id] = newGame;
}

function getGame(id) {
  return games[id];
}

function getAllGameIds() {
  return Object.keys(games);
}

module.exports = {
  createGame,
  getGame,
  getAllGameIds,
};
