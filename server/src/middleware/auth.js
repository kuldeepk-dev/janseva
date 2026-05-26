const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/env");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).send("Missing auth token");
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    return res.status(401).send("Invalid auth token");
  }
}

function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

module.exports = { requireAuth, createToken };
