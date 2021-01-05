const jwt = require("jsonwebtoken");
const client = require("../helpers/init_redis");

function signAccessToken(username) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      {
        username,
      },
      process.env.JWT_KEY,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(token);
      }
    );
  });
}

function verifyAccessToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_KEY, (err, payload) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(payload);
    });
  });
}

function signRefreshToken(username) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { username },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "1y" },
      (err, token) => {
        if (err) {
          reject(err);
          return;
        }

        client.SET(username, token, "EX", 365 * 24 * 60 * 60, (err, reply) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(token);
        });
      }
    );
  });
}

function verifyRefreshToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_REFRESH_KEY, (err, payload) => {
      if (err) {
        reject(err);
        return;
      }
      const { username } = payload;

      client.GET(username, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        if (token === result) return resolve(username);
        reject("Unauthorized");
      });
    });
  });
}

function invalidateRefreshToken(username) {
  return new Promise((resolve, reject) => {
    client.DEL(username, (err, response) => {
      if (response == 1) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

module.exports = {
  invalidateRefreshToken,
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
};
