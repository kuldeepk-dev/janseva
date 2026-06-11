const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc, toPublicDocs } = require("../utils/serializers");

async function recomputeOfficerComplaintCounts(db, officerDoc) {
  if (!officerDoc) return;
  const profileId = officerDoc.profile_id ? String(officerDoc.profile_id) : null;
  const departmentId = officerDoc.department_id ? String(officerDoc.department_id) : null;
  if (!profileId && !departmentId) return;

  const filter = profileId && departmentId
    ? { $or: [{ assigned_officer_id: profileId }, { assigned_department_id: departmentId }] }
    : profileId
      ? { assigned_officer_id: profileId }
      : { assigned_department_id: departmentId };

  const complaints = await db.collection("complaints").find(filter).toArray();
  const totalAssigned = complaints.length;
  const pending = complaints.filter(item => item.status !== "resolved" && item.status !== "closed").length;

  await db.collection("officers").updateOne(
    { _id: officerDoc._id },
    {
      $set: {
        total_complaints_assigned: totalAssigned,
        pending_complaints: pending,
        updated_at: new Date().toISOString(),
      },
    },
  );

  if (profileId) {
    await db.collection("profiles").updateOne(
      { _id: new ObjectId(profileId) },
      {
        $set: {
          total_complaints_assigned: totalAssigned,
          pending_complaints: pending,
          updated_at: new Date().toISOString(),
        },
      },
    );
  }

  return { totalAssigned, pending };
}

async function refreshOfficerCountsForComplaint(db, complaint) {
  if (!complaint) return;
  const updates = [];
  if (complaint.assigned_officer_id) {
    const officer = await db.collection("officers").findOne({ profile_id: complaint.assigned_officer_id });
    if (officer) updates.push(recomputeOfficerComplaintCounts(db, officer));
  }
  if (complaint.assigned_department_id) {
    const officers = await db.collection("officers").find({ department_id: complaint.assigned_department_id }).toArray();
    for (const officer of officers) {
      updates.push(recomputeOfficerComplaintCounts(db, officer));
    }
  }
  await Promise.all(updates);
}

function registerOfficerRoutes(app, db) {
  app.get("/departments/:id/officers", requireAuth, async (req, res) => {
    const { id } = req.params;
    const officers = await db.collection("officers").find({ department_id: id }).toArray();
    if (!officers.length) {
      return res.json([]);
    }

    const profileIds = officers
      .map(item => item.profile_id)
      .filter(Boolean)
      .map(profileId => (profileId instanceof ObjectId ? profileId : new ObjectId(profileId)));

    const profiles = await db
      .collection("profiles")
      .find({ _id: { $in: profileIds } })
      .toArray();

    const profileMap = new Map(
      profiles.map(profile => [profile._id.toString(), profile]),
    );

    const data = officers.map(officer => {
      const profileKey =
        officer.profile_id instanceof ObjectId
          ? officer.profile_id.toString()
          : String(officer.profile_id || "");
      const profile = profileMap.get(profileKey);
      return {
        id: officer._id.toString(),
        profile_id: profileKey,
        department_id: officer.department_id ?? null,
        full_name: profile?.full_name ?? officer.full_name ?? null,
        email: profile?.email ?? null,
        contact: officer.contact ?? profile?.mobile ?? null,
        sla_days: officer.sla_days ?? null,
        categories: officer.categories ?? null,
        total_complaints_assigned: officer.total_complaints_assigned ?? 0,
        pending_complaints: officer.pending_complaints ?? 0,
      };
    });

    return res.json(data);
  });

  app.get("/officers", requireAuth, async (req, res) => {
    const data = await db.collection("officers").find().sort({ created_at: -1 }).toArray();
    return res.json(toPublicDocs(data));
  });

  app.post("/officers", requireAuth, async (req, res) => {
    const { department_id, full_name, contact, sla_days, categories } = req.body || {};
    if (!full_name || typeof full_name !== "string" || !full_name.trim()) {
      return res.status(400).send("Missing officer name");
    }
    const parsedSla =
      sla_days === undefined || sla_days === null
        ? null
        : Number.isFinite(Number(sla_days))
          ? Number(sla_days)
          : null;
    if (sla_days !== undefined && parsedSla === null) {
      return res.status(400).send("Invalid SLA days");
    }

    const now = new Date().toISOString();
    const payload = {
      department_id: department_id ?? null,
      full_name: full_name.trim(),
      contact: contact ?? null,
      sla_days: parsedSla,
      categories: Array.isArray(categories) ? categories : null,
      total_complaints_assigned: 0,
      pending_complaints: 0,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection("officers").insertOne(payload);
    const created = await db.collection("officers").findOne({ _id: result.insertedId });
    return res.json(toPublicDoc(created));
  });
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

  return { recomputeOfficerComplaintCounts, refreshOfficerCountsForComplaint };
}

module.exports = { registerOfficerRoutes, recomputeOfficerComplaintCounts, refreshOfficerCountsForComplaint };
