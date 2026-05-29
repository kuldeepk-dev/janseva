const { ObjectId } = require("mongodb");
const { createToken } = require("../middleware/auth");
const { toPublicDoc } = require("../utils/serializers");

function registerAuthRoutes(app, db, { DEV_OTP_ECHO }) {
  const DEMO_MOBILE = "+919999999999";
  const DEMO_OTP = "123456";
  app.post("/auth/otp/request", async (req, res) => {
    const { mobile } = req.body || {};
    if (!mobile) return res.status(400).send("Missing mobile number");

    const token = String(Math.floor(100000 + Math.random() * 900000));
    await db.collection("otp_tokens").insertOne({
      mobile,
      token,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

    return res.json({ ok: true, devOtp: DEV_OTP_ECHO ? token : undefined });
  });

  app.post("/auth/otp/verify", async (req, res) => {
    const { mobile, token } = req.body || {};
    if (!mobile || !token) return res.status(400).send("Missing mobile/token");

    if (!(mobile === DEMO_MOBILE && token === DEMO_OTP)) {
      const record = await db.collection("otp_tokens").findOne({ mobile, token });
      if (!record) return res.status(401).send("Invalid OTP");
      if (new Date(record.expires_at) < new Date()) return res.status(401).send("OTP expired");

      await db.collection("otp_tokens").deleteMany({ mobile });
    }

    let profile = await db.collection("profiles").findOne({ mobile });
    if (!profile) {
      const now = new Date().toISOString();
      const result = await db.collection("profiles").insertOne({
        role: "citizen",
        full_name: null,
        mobile,
        email: null,
        preferred_language: "en",
        created_at: now,
        updated_at: now,
      });
      profile = await db.collection("profiles").findOne({ _id: result.insertedId });
    }

    const tokenValue = createToken({ id: profile._id.toString(), role: profile.role });
    return res.json({ token: tokenValue, profile: toPublicDoc(profile) });
  });

  app.post("/auth/staff/login", async (req, res) => {
    const bcrypt = require("bcryptjs");
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).send("Missing email/password");

    const staffUser = await db.collection("staff_users").findOne({ email });
    if (!staffUser) return res.status(401).send("Staff account not found");

    const match = await bcrypt.compare(password, staffUser.password_hash);
    if (!match) return res.status(401).send("Invalid credentials");

    const profile = await db.collection("profiles").findOne({ _id: new ObjectId(staffUser.profile_id) });
    if (!profile) return res.status(401).send("Profile not found");

    const tokenValue = createToken({ id: profile._id.toString(), role: staffUser.role || profile.role });
    return res.json({ token: tokenValue, profile: toPublicDoc(profile) });
  });
}

module.exports = { registerAuthRoutes };
