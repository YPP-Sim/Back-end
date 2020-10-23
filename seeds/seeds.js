const { runSeed, getSystemUserId } = require("./users/system_user_seed");
const Map = require("../models/Map");
const User = require("../models/User");

const mapSeeds = [
  require("./maps/basic_map_seed"),
  require("./maps/ambush_round_1_seed"),
];

let system_user_id = null;

async function runSeeds() {
  console.log("Dropping Map collection...");
  console.log("--Starting to run seeds--");

  // Create system user first
  try {
    system_user_id = await runSeed();
  } catch (err) {
    console.log("Already created system user seed");
    system_user_id = await getSystemUserId();
  }

  // Maps
  for (let mapSeed of mapSeeds) {
    mapSeed
      .runSeed(system_user_id)
      .then(() => {
        console.log("Finished map seed: ", mapSeed.title);
      })
      .catch((err) => {
        if (err.code === 11000) {
          console.log("Seed already created for map: ", mapSeed.title);
        } else console.log("Err running seed for map: ", mapSeed.title, err);
      });
  }
}

module.exports = { runSeeds, system_user_id };
