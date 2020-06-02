const fs = require("fs");

function getFreshMapGrid(map) {
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
    fs.readFile(`./maps/${mapName}.txt`, "utf8", (err, data) => {
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

module.exports = {
  getFreshMapGrid,
  isRock,
  readMapFromFile,
};
