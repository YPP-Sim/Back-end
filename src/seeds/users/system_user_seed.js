const User = require("../../models/User");

async function runSeed() {
  return new Promise(async (resolve, reject) => {
    User.create({
      username: "System",
      email: "system@yppsim.com",
      password: "sys", // will be invalid no matter what due to bcrypt checking it.
    })
      .then(async (docs) => {
        if (docs.length === 0) {
          return await getSystemUserId();
        }
        resolve(docs[0]._id);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

async function getSystemUserId() {
  try {
    const docs = await User.find({ username: "System" });
    if (docs.length === 0) throw "Could not find system user id";

    return docs[0]._id;
  } catch (err) {
    console.log("Error getting system user id: ", err);
    return null;
  }
}

module.exports = { runSeed, getSystemUserId };
