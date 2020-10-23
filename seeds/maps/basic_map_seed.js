const Map = require("../../models/Map");
const moment = require("moment");

const layout = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 17, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 21],
  [0, 19, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
const title = "Basic map";

async function runSeed(system_user_id) {
  return new Promise(async (resolve, reject) => {
    Map.create({
      title,
      layout: layout,
      createdBy: system_user_id,
      createdAt: moment().format(),
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = { runSeed, title };
