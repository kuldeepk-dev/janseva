const path = require("path");

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const DEV_OTP_ECHO = process.env.DEV_OTP_ECHO === "true";
const ADMIN_SEED_EMAIL = process.env.ADMIN_SEED_EMAIL;
const ADMIN_SEED_PASSWORD = process.env.ADMIN_SEED_PASSWORD;
const ADMIN_SEED_NAME = process.env.ADMIN_SEED_NAME || "Admin";
const SEED_DATA_ENABLED = process.env.SEED_DATA_ENABLED !== "false";
const DEMO_STAFF_SEED_ENABLED = process.env.DEMO_STAFF_SEED_ENABLED === "true";
const DEMO_STAFF_PASSWORD = process.env.DEMO_STAFF_PASSWORD || "Demo@12345";
const OFFICER_SEED_PASSWORD = process.env.OFFICER_SEED_PASSWORD;
const OFFICER_SEED_EMAIL_DOMAIN =
  process.env.OFFICER_SEED_EMAIL_DOMAIN || "janseva.local";
const DEMO_COMPLAINTS_SEED_ENABLED =
  process.env.DEMO_COMPLAINTS_SEED_ENABLED === "true";
const ENABLE_OTP_FLOW = process.env.ENABLE_OTP_FLOW === "true";
const ENABLE_WHATSAPP_FLOW = process.env.ENABLE_WHATSAPP_FLOW === "true";
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
  SEED_DATA_ENABLED,
  DEMO_STAFF_SEED_ENABLED,
  DEMO_STAFF_PASSWORD,
  OFFICER_SEED_PASSWORD,
  OFFICER_SEED_EMAIL_DOMAIN,
  DEMO_COMPLAINTS_SEED_ENABLED,
  ENABLE_OTP_FLOW,
  ENABLE_WHATSAPP_FLOW,
  UPLOADS_DIR,
};
