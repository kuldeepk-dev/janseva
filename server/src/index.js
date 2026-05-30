const fs = require("fs");
const path = require("path");
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
const { registerOfficerRoutes } = require("./routes/officer");
const { registerOperatorRoutes } = require("./routes/operator");
const { registerSocialPostRoutes } = require("./routes/socialPosts");
const { registerWhatsappRoutes } = require("./routes/whatsapp");
const { createUpload, registerUploadRoutes } = require("./routes/uploads");

if (!env.MONGODB_URI) {
  console.error("Missing MONGODB_URI in server/.env");
  process.exit(1);
}

if (!fs.existsSync(env.UPLOADS_DIR)) {
  fs.mkdirSync(env.UPLOADS_DIR, { recursive: true });
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(env.UPLOADS_DIR));

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

const storage = {
  _handleFile(req, file, cb) {
    const ext = path.extname(file.originalname || "");
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    const outPath = path.join(env.UPLOADS_DIR, name);
    const outStream = fs.createWriteStream(outPath);
    file.stream.pipe(outStream);
    outStream.on("error", cb);
    outStream.on("finish", () => cb(null, { path: outPath, filename: name }));
  },
  _removeFile(req, file, cb) {
    fs.unlink(file.path, cb);
  },
};

const upload = createUpload(storage);

async function start() {
  const db = await connectDb(env);

  registerAuthRoutes(app, db, env);
  registerProfileRoutes(app, db);
  registerDepartmentRoutes(app, db);
  registerVoterRoutes(app, db);
  registerComplaintRoutes(app, db);
  registerOfficerRoutes(app, db);
  registerOperatorRoutes(app, db);
  registerSocialPostRoutes(app, db);
  registerWhatsappRoutes(app, db);
  registerUploadRoutes(app, upload, env);

  app.listen(env.PORT, () => {
    console.log(`API listening on ${env.PORT}`);
  });
}

start().catch(err => {
  console.error("Failed to start server", err);
  process.exit(1);
});
