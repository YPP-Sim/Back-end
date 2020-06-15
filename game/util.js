const fs = require("fs");
const path = require("path");
const Move = require("./moves/Move");

function getFreshMapGrid(map) {
  map = addSafeZone(map);
  const rows = map.length;
  const columns = map[0].length;

  // We clone the multi-dimensional array this way, as the spread (...) operator does not work on
  // Mutli dimensional arrays, as the next level deep will just pass by reference
  const detailedMap = JSON.parse(JSON.stringify(map));

  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const cellData = {
        cell_id: map[row][column],
        occupiedBy: null,
        claiming: [],
      };
      detailedMap[row][column] = cellData;
    }
  }
  return detailedMap;
}

function addSafeZone(map) {
  const width = map[0].length;
  const safeZoneRow = new Array(width).fill(-1);
  map.push(safeZoneRow);
  map.push(safeZoneRow);
  map.push(safeZoneRow);

  map.unshift(safeZoneRow);
  map.unshift(safeZoneRow);
  map.unshift(safeZoneRow);

  return map;
}

function isRock(cell_id) {
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

module.exports = {
  getFreshMapGrid,
  isRock,
  readMapFromFile,
  getAllAvailableMaps,
  addSafeZone,
};
