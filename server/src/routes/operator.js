const { requireAuth } = require("../middleware/auth");
const { toPublicDocs } = require("../utils/serializers");

function registerOperatorRoutes(app, db) {
  app.get("/operator/stats", requireAuth, async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [registeredToday, complaintsLogged, walkInsServed, pendingTasks] = await Promise.all([
      db.collection("voters").countDocuments({ created_at: { $gte: todayISO } }),
      db.collection("complaints").countDocuments({ created_at: { $gte: todayISO } }),
      db.collection("audit_logs").countDocuments({ action: "walk_in_served", created_at: { $gte: todayISO } }),
      db.collection("complaints").countDocuments({ status: { $nin: ["resolved", "closed"] } })
    ]);

    return res.json({
      registeredToday,
      complaintsLogged,
      walkInsServed,
      pendingTasks
    });
  });

  app.get("/operator/activity-logs", requireAuth, async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const logs = await db.collection("audit_logs")
      .find()
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();

    return res.json(toPublicDocs(logs));
  });
}

module.exports = { registerOperatorRoutes };
