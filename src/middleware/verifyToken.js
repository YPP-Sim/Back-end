const { verifyAccessToken } = require("../helpers/jwt_helper");

async function verifyToken(req, res, next) {
  if (!req.headers["authorization"]) {
    res.status(401).json({ message: "Authorization header missing" });
    return;
  }

  const authHeader = req.headers["authorization"];
  const bearerToken = authHeader.split(" ");
  const token = bearerToken[1];
  try {
    const data = await verifyAccessToken(token);
    req.username = data.username;
    next();
  } catch (err) {
    res.status(401).json({ error: "Access token could not be verified" });
  }
}

module.exports = verifyToken;
