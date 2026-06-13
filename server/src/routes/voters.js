const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc, toPublicDocs } = require("../utils/serializers");

function registerVoterRoutes(app, db) {
  app.post("/voters", requireAuth, async (req, res) => {
    const payload = req.body || {};
    const now = new Date().toISOString();
    const voter = {
      ...payload,
      profile_id: payload.profile_id ?? req.user.id,
      created_by: req.user.id,
      created_by_user_id: req.user.id,
      created_by_role: req.user.role === "operator" ? "operator" : req.user.role,
      created_at: now,
      updated_at: now,
    };
    const result = await db.collection("voters").insertOne(voter);
    const created = await db.collection("voters").findOne({ _id: result.insertedId });
    return res.json(toPublicDoc(created));
  });

  app.put("/voters/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const payload = req.body || {};
    await db.collection("voters").updateOne({ _id: new ObjectId(id) }, { $set: { ...payload, updated_at: new Date().toISOString() } });
    const updated = await db.collection("voters").findOne({ _id: new ObjectId(id) });
    return res.json(toPublicDoc(updated));
  });

  app.get("/voters/me", requireAuth, async (req, res) => {
    const voter = await db.collection("voters").findOne({ profile_id: req.user.id });
    return res.json(toPublicDoc(voter));
  });

  app.get("/voters/search", requireAuth, async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) return res.json([]);

    const regex = new RegExp(q, "i");
    const data = await db.collection("voters").find({ $or: [{ full_name: regex }, { voter_id: regex }, { booth_number: regex }] }).limit(25).toArray();
    return res.json(toPublicDocs(data));
  });
}

module.exports = { registerVoterRoutes };
