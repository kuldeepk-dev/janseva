const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const env = require("./config/env");
const { connectDb } = require("./db");
const { registerAuthRoutes } = require("./routes/auth");
const { registerProfileRoutes } = require("./routes/profiles");
const { registerDepartmentRoutes } = require("./routes/departments");
const { registerVoterRoutes } = require("./routes/voters");
const { registerComplaintRoutes } = require("./routes/complaints");
const { registerOperatorRoutes } = require("./routes/operator");
const { registerSocialPostRoutes } = require("./routes/socialPosts");
const { registerRoutingRoutes } = require("./routes/routing");
const { registerUploadRoutes } = require("./routes/uploads");
const { createFileStorage, ensureLocalUploadsDir } = require("./services/uploadStorage");

if (!env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in server/.env");
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const fileStorage = createFileStorage(env);

if (!fileStorage.usesS3) {
  ensureLocalUploadsDir(env.UPLOADS_DIR);
  app.use("/uploads", express.static(env.UPLOADS_DIR));
}

app.get("/config/citizen-flow", (req, res) => {
  res.json({
    otp_enabled: env.ENABLE_OTP_FLOW,
    whatsapp_enabled: env.ENABLE_WHATSAPP_FLOW,
    registration_enabled: true,
    complaints_enabled: true,
    social_feed_enabled: true,
    reopen_window_days: 7,
  });
});

async function start() {
  const db = await connectDb(env);

  registerAuthRoutes(app, db, env);
  registerProfileRoutes(app, db);
  registerDepartmentRoutes(app, db);
  registerVoterRoutes(app, db);
  registerComplaintRoutes(app, db);
  registerOperatorRoutes(app, db);
  registerSocialPostRoutes(app, db);
  registerRoutingRoutes(app, db);
  registerUploadRoutes(app, fileStorage);

  app.listen(env.PORT, () => {
    console.log(`API listening on ${env.PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start server", err);
  process.exit(1);
});
