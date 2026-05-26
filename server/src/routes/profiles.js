const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc } = require("../utils/serializers");

function registerProfileRoutes(app, db) {
  app.get("/profiles/me", requireAuth, async (req, res) => {
    const profile = await db.collection("profiles").findOne({ _id: new ObjectId(req.user.id) });
    return res.json(toPublicDoc(profile));
  });
}

module.exports = { registerProfileRoutes };
