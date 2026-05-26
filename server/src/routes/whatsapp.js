const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc, toPublicDocs } = require("../utils/serializers");

function registerWhatsappRoutes(app, db) {
  app.get("/whatsapp-templates", requireAuth, async (req, res) => {
    const data = await db.collection("whatsapp_templates").find().sort({ updated_at: -1 }).toArray();
    return res.json(toPublicDocs(data));
  });

  app.put("/whatsapp-templates/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { body } = req.body || {};
    await db.collection("whatsapp_templates").updateOne(
      { _id: new ObjectId(id) },
      { $set: { body, updated_by: req.user.id, updated_at: new Date().toISOString() } }
    );
    const updated = await db.collection("whatsapp_templates").findOne({ _id: new ObjectId(id) });
    return res.json(toPublicDoc(updated));
  });
}

module.exports = { registerWhatsappRoutes };
