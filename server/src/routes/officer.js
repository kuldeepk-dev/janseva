const { requireAuth } = require("../middleware/auth");
const { toPublicDocs } = require("../utils/serializers");

function registerOfficerRoutes(app, db) {
  app.get("/officer/queue", requireAuth, async (req, res) => {
    const officer = await db.collection("officers").findOne({ profile_id: req.user.id });
    const departmentId = officer?.department_id || null;
    const filter = departmentId
      ? { $or: [{ assigned_officer_id: req.user.id }, { assigned_department_id: departmentId }] }
      : { assigned_officer_id: req.user.id };
    const data = await db.collection("complaints").find(filter).sort({ created_at: -1 }).toArray();
    return res.json(toPublicDocs(data));
  });

  app.get("/officer/stats", requireAuth, async (req, res) => {
    const officer = await db.collection("officers").findOne({ profile_id: req.user.id });
    const departmentId = officer?.department_id || null;
    const filter = departmentId
      ? { $or: [{ assigned_officer_id: req.user.id }, { assigned_department_id: departmentId }] }
      : { assigned_officer_id: req.user.id };
    const data = await db.collection("complaints").find(filter).toArray();

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const assigned = data.length;
    const dueToday = data.filter(item => item.expected_resolution_at?.startsWith(todayStr)).length;
    const resolvedMonth = data.filter(item => item.resolved_at && new Date(item.resolved_at) >= startOfMonth).length;

    return res.json({ assigned, dueToday, resolvedMonth });
  });
}

module.exports = { registerOfficerRoutes };
