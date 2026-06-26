const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDocs } = require("../utils/serializers");

function registerOperatorRoutes(app, db) {
  app.get("/operator/operators", requireAuth, async (req, res) => {
    if (req.user.role !== "leader" && req.user.role !== "admin") {
      return res.status(403).send("Only leadership can view the operator directory.");
    }

    const staffUsers = await db
      .collection("staff_users")
      .find({ role: "operator" })
      .sort({ created_at: 1, email: 1 })
      .toArray();

    const profileIds = staffUsers
      .map(user => String(user.profile_id || ""))
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));

    const profiles = profileIds.length
      ? await db
          .collection("profiles")
          .find({ _id: { $in: profileIds } })
          .toArray()
      : [];

    const profileById = new Map(
      profiles.map(profile => [profile._id.toString(), profile]),
    );

    const assignmentLogs = await db
      .collection("audit_logs")
      .find({
        action: "assign_complaint",
        entity_type: "complaints",
      })
      .sort({ created_at: -1 })
      .toArray();

    const latestAssignmentByComplaint = new Map();
    const complaintsByOperator = new Map();

    assignmentLogs.forEach(log => {
      const complaintId = String(log.entity_id || "");
      const operatorId = String(log.actor_profile_id || "");
      if (!complaintId || !operatorId || latestAssignmentByComplaint.has(complaintId)) {
        return;
      }

      latestAssignmentByComplaint.set(complaintId, operatorId);

      const current = complaintsByOperator.get(operatorId) ?? new Set();
      current.add(complaintId);
      complaintsByOperator.set(operatorId, current);
    });

    const complaintObjectIds = [...latestAssignmentByComplaint.keys()]
      .filter(id => ObjectId.isValid(id))
      .map(id => new ObjectId(id));
    const complaintDocs = complaintObjectIds.length
      ? await db
          .collection("complaints")
          .find({ _id: { $in: complaintObjectIds } })
          .project({ status: 1 })
          .toArray()
      : [];
    const complaintStatusById = new Map(
      complaintDocs.map(complaint => [complaint._id.toString(), complaint.status]),
    );

    const directory = await Promise.all(
      staffUsers.map(async staffUser => {
        const profileId = String(staffUser.profile_id || "");
        const profile = profileById.get(profileId) || null;
        const resolvedName = profile?.full_name ?? staffUser.name ?? null;
        const resolvedEmail = profile?.email ?? staffUser.email ?? null;
        const resolvedMobile = profile?.mobile ?? null;
        const resolvedLanguage = profile?.preferred_language ?? "en";
        const resolvedCreatedAt = profile?.created_at ?? staffUser.created_at ?? null;
        const resolvedUpdatedAt = profile?.updated_at ?? staffUser.updated_at ?? null;

        const [activityCount, lastActivity] = profileId
          ? await Promise.all([
              db.collection("audit_logs").countDocuments({ actor_profile_id: profileId }),
              db
                .collection("audit_logs")
                .find({ actor_profile_id: profileId })
                .sort({ created_at: -1 })
                .limit(1)
                .toArray(),
            ])
          : [0, []];

        const lastActivityAt = lastActivity[0]?.created_at ?? null;
        const assignedComplaintIds = complaintsByOperator.get(profileId) ?? new Set();
        const totalAssignedCases = assignedComplaintIds.size;
        const pendingCases = [...assignedComplaintIds].filter(complaintId => {
          const status = complaintStatusById.get(complaintId);
          return status ? !["resolved", "closed"].includes(status) : false;
        }).length;

        return {
          id: profile?._id?.toString() ?? profileId,
          profile_id: profileId || null,
          full_name: resolvedName,
          email: resolvedEmail,
          mobile: resolvedMobile,
          preferred_language: resolvedLanguage,
          created_at: resolvedCreatedAt,
          updated_at: resolvedUpdatedAt,
          total_complaints_assigned: totalAssignedCases,
          pending_complaints: pendingCases,
          activity_count: activityCount,
          last_activity_at: lastActivityAt,
          role: "operator",
        };
      }),
    );

    directory.sort((left, right) => {
      const leftName = (left.full_name || left.email || "").toLowerCase();
      const rightName = (right.full_name || right.email || "").toLowerCase();
      return leftName.localeCompare(rightName);
    });

    return res.json(directory);
  });

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
