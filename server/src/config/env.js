const path = require("path");

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const DEV_OTP_ECHO = process.env.DEV_OTP_ECHO === "true";
const ADMIN_SEED_EMAIL = process.env.ADMIN_SEED_EMAIL;
const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
const ADMIN_SEED_NAME = process.env.ADMIN_SEED_NAME || "Admin";
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

module.exports = {
  PORT,
  MONGODB_URI,
  JWT_SECRET,
  BASE_URL,
  DEV_OTP_ECHO,
  ADMIN_SEED_EMAIL,
  ADMIN_SEED_PASSWORD,
  ADMIN_SEED_NAME,
  UPLOADS_DIR,
};
