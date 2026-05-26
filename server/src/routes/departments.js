const { requireAuth } = require("../middleware/auth");
const { toPublicDocs } = require("../utils/serializers");

function registerDepartmentRoutes(app, db) {
  app.get("/departments", requireAuth, async (req, res) => {
    const data = await db.collection("departments").find().sort({ name: 1 }).toArray();
    return res.json(toPublicDocs(data));
  });
}

module.exports = { registerDepartmentRoutes };
