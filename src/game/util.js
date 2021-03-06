const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const Move = require("./moves/Move");
const WindType = require("./WindType");
const Orientation = require("./Orientation");
const Flag = require("./Flag");

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
 * @param {number} cell_id
 * @returns { WindType }
 */
function getWindTypeById(cell_id) {
  switch (cell_id) {
    case 1:
      return WindType.NORTH_WIND;
    case 2:
      return WindType.EAST_WIND;
    case 3:
      return WindType.SOUTH_WIND;
    case 4:
      return WindType.WEST_WIND;
    case 5:
      return WindType.WHIRLWIND_CLOCKWISE_SE;
    case 6:
      return WindType.WHIRLWIND_CLOCKWISE_SW;
    case 7:
      return WindType.WHIRLWIND_CLOCKWISE_NW;
    case 8:
      return WindType.WHIRLWIND_CLOCKWISE_NE;
    case 9:
      return WindType.WHIRLWIND_COUNTER_CLOCKWISE_SE;
    case 10:
      return WindType.WHIRLWIND_COUNTER_CLOCKWISE_SW;
    case 11:
      return WindType.WHIRLWIND_COUNTER_CLOCKWISE_NW;
    case 12:
      return WindType.WHIRLWIND_COUNTER_CLOCKWISE_NE;
    default:
      return null;
  }
}

function getFreshMapGrid(map) {
  let mapCopy = JSON.parse(JSON.stringify(map));
  const newMap = addSafeZone(mapCopy);
  const rows = newMap.length;
  const columns = newMap[0].length;

  // We clone the multi-dimensional array this way, as the spread (...) operator does not work on
  // Mutli dimensional arrays, as the next level deep will just pass by reference

  const detailedMap = JSON.parse(JSON.stringify(newMap));

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cellData = {
        cell_id: newMap[row][column],
        occupiedBy: null,
        claiming: [],
      };
      detailedMap[row][column] = cellData;
    }
  }
  return detailedMap;
}

function addSafeZone(map) {
  let mapCopy = JSON.parse(JSON.stringify(map));

  const width = mapCopy[0].length;
  const safeZoneRow = new Array(width).fill(-1);
  mapCopy.push(safeZoneRow);
  mapCopy.push(safeZoneRow);
  mapCopy.push(safeZoneRow);

  mapCopy.unshift(safeZoneRow);
  mapCopy.unshift(safeZoneRow);
  mapCopy.unshift(safeZoneRow);

  return mapCopy;
}

/**
 * Finds the property in the object with the smallest number, then returns that property name.
 * @param {*} obj
 */
function findSmallestToken(obj) {
  let smallestToken = null;
  for (let prop in obj) {
    if (smallestToken === null) {
      smallestToken = prop;
      continue;
    }

    const currentToken = obj[prop];
    if (currentToken.amount < obj[smallestToken].amount) smallestToken = prop;
  }
  return smallestToken;
}

function isRock(cell_id) {
  switch (cell_id) {
    case 13:
    case 14:
    case 15:
    case 16:
    case 20:
    case 21:
    case 22:
    case 23:
      return true;
    default:
      return false;
  }
}

function isSmallRock(cell_id) {
  switch (cell_id) {
    case 20:
    case 21:
    case 22:
    case 23:
      return true;
    default:
      return false;
  }
}

function isTallRock(cell_id) {
  switch (cell_id) {
    case 13:
    case 14:
    case 15:
    case 16:
      return true;
    default:
      return false;
  }
}

function readMapFromFile(mapName) {
  return new Promise((resolve, reject) => {
    const path = `./maps/${mapName}.txt`;
    if (!fs.existsSync(path)) {
      reject("Map does not exist: " + mapName);
      return;
    }

    fs.readFile(path, "utf8", async (err, data) => {
      if (err) {
        reject(err);
      }

      const lines = data.split(/\r?\n/);
      const mapArray = [];
      for (let line of lines) {
        const cell_ids = line.split(",");
        const xArray = [];
        for (let cell of cell_ids) {
          cell = cell.trim();
          if (cell.length > 0) xArray.push(parseInt(cell));
        }
        if (xArray.length > 0) mapArray.push(xArray);
      }
      resolve(mapArray);
    });
  });
}

function getAllAvailableMaps() {
  return new Promise((resolve, reject) => {
    const directoryPath = path.join(__dirname, "../maps");
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        reject(err);
      } else {
        const newFiles = removeFileExtensions(files);
        resolve(newFiles);
      }
    });
  });
}

function removeFileExtensions(files) {
  const newFileArray = [];
  for (file of files) newFileArray.push(file.split(".")[0]);

  return newFileArray;
}

function getOppositeOrientation(orientation) {
  switch (orientation) {
    case Orientation.EAST:
      return Orientation.WEST;
    case Orientation.WEST:
      return Orientation.EAST;
    case Orientation.NORTH:
      return Orientation.SOUTH;
    case Orientation.SOUTH:
      return Orientation.NORTH;

    default:
      return null;
  }
}

function getFlagLocationsList(rawMap) {
  const height = rawMap.length;
  const length = rawMap[0].length;

  const flagsArray = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < length; x++) {
      const cell_id = rawMap[y][x];

      if (cell_id === 17 || cell_id === 18 || cell_id === 19) {
        // Checks point value of cell id, 17 = 1, 18 = 2, 19 = 3.
        const pointValue = cell_id === 17 ? 1 : cell_id === 18 ? 2 : 3;

        flagsArray.push(new Flag(x, y, pointValue));
      }
    }
  }

  return flagsArray;
}

function isActionableDirection(direction) {
  if (direction === null || direction === undefined) return false;
  switch (direction) {
    case "FORWARD":
    case "LEFT":
    case "RIGHT":
      return true;
    default:
      return false;
  }
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

module.exports = {
  getFreshMapGrid,
  getFlagLocationsList,
  isRock,
  isTallRock,
  getWindTypeById,
  getOppositeOrientation,
  readMapFromFile,
  findSmallestToken,
  getAllAvailableMaps,
  addSafeZone,
  isActionableDirection,
  isSmallRock,
  defaultMap,
  verifyToken,
};
