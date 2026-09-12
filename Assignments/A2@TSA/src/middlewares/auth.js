const jwt = require("jsonwebtoken");
const env = require("../config/envConfig");
const { findUserById } = require("../services/userService");

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({error: "No token"});
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({error: "user not found"});
    }
    req.user = user;
    next();
  }
  catch (err) {
    return res.status(401).json({error: "Invalid token"});
  }
}

module.exports = { authenticate };