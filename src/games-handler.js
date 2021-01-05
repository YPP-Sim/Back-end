const { getSocketIO } = require("./index");
const Map = require("./models/Map");

const Game = require("./game/game");
const JobberQuality = require("./game/JobberQuality");

const games = {};

/**
 * @param {string} id The unique identifier of the game that will be used to retrieve the instance later
 * @param { Array.<Array.<number>>} map The map the game will be using
 * @param { JobberQuality } jobberQuality The quality of jobbers that everyone will get by default
 */
async function createGame(
  id,
  map,
  jobberQuality,
  mapName,
  maxPlayers,
  locked,
  password,
  gameOwner
) {
  if (games[id]) throw `Game with id '${id}' already exists`;
  try {
    const newGame = new Game(
      map,
      jobberQuality,
      id,
      getSocketIO().sockets.in(id.toString()),
      mapName,
      maxPlayers,
      locked,
      password,
      gameOwner
    );

    games[id] = newGame;
  } catch (err) {
    console.log("Could not load map: ", err);
  }
}

function removeGame(id) {
  if (games[id]) {
    games[id].stop();
    delete games[id];
  }
}

/**
 * @param {string} id
 *
 * @returns {Game} the game object
 */
function getGame(id) {
  return games[id];
}

function getAllGameIds() {
  return Object.keys(games);
}

function getAllGames() {
  return games;
}

module.exports = {
  createGame,
  getAllGames,
  getGame,
  removeGame,
  getAllGameIds,
};
