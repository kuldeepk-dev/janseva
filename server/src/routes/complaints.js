const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc } = require("../utils/serializers");
const { nextComplaintNumber } = require("../utils/complaints");

const STAFF_ROLES = new Set(["operator", "leader", "admin"]);
const VALID_STATUSES = new Set([
  "unassigned",
  "assigned",
  "acknowledged",
  "in_progress",
  "resolved",
  "escalated",
  "closed",
  "reopened",
]);

function isStaffRole(role) {
  return STAFF_ROLES.has(role);
}

function isValidObjectId(id) {
  return typeof id === "string" && ObjectId.isValid(id);
}

function toComplaintResponse(doc) {
  const data = toPublicDoc(doc);
  if (!data) {
    return null;
  }
  delete data.assigned_officer_id;
  delete data.assigned_to_officer;
  delete data.officer_id;
  return data;
}

function toComplaintResponses(docs) {
  return docs.map(toComplaintResponse);
}

function buildComplaintUpdate(status, resolutionNote, resolutionDetails) {
  const now = new Date().toISOString();
  const update = { status, updated_at: now };

  if (resolutionNote !== undefined) {
    update.resolution_note = resolutionNote || null;
  }

  if (resolutionDetails !== undefined) {
    update.resolution_details = resolutionDetails || null;
  }

  if (status === "resolved") {
    update.resolved_at = now;
    if (update.resolution_note === undefined) {
      update.resolution_note = resolutionNote || null;
    }
  }

  if (status === "closed") {
    update.closed_at = now;
  }

  if (status === "reopened") {
    update.reopened_at = now;
  }

  return update;
}

function defaultTimelineNote(status, actorRole) {
  if (actorRole === "citizen" && status === "reopened") {
    return "Citizen requested reopening";
  }

  switch (status) {
    case "assigned":
      return "Complaint assigned to department by operator";
    case "acknowledged":
      return "Operator accepted the complaint";
    case "in_progress":
      return "Operator changed status to In Progress";
    case "resolved":
      return "Operator resolved the complaint";
    case "escalated":
      return "Operator escalated the complaint for leadership review";
    case "closed":
      return "Operator closed the complaint";
    case "reopened":
      return "Operator reopened the complaint";
    default:
      return "Complaint status updated";
  }
}

function buildOperatorNoteUpdate(currentNote, note) {
  if (note === undefined) {
    return null;
  }

  const normalizedNextNote = note || null;
  if (valuesEqual(currentNote, normalizedNextNote)) {
    return null;
  }

  return {
    operator_note: normalizedNextNote,
    operator_note_updated_at: new Date().toISOString(),
  };
}

function normalizeComparable(value) {
  return value === undefined ? undefined : value ?? null;
}

function valuesEqual(left, right) {
  return normalizeComparable(left) === normalizeComparable(right);
}

function hasAnyChange(current, next, fields) {
  return fields.some(field => !valuesEqual(current[field], next[field]));
}

async function createComplaintNotifications(db, complaint, title, body) {
  if (!complaint || !complaint.citizen_profile_id) {
    return;
  }

  await db.collection("notifications").insertOne({
    recipient_profile_id: complaint.citizen_profile_id,
    recipient_role: "citizen",
    title,
    body,
    entity_type: "complaint",
    entity_id: complaint._id.toString(),
    created_at: new Date().toISOString(),
    read_at: null,
  });
}

async function loadComplaint(db, id) {
  if (!isValidObjectId(id)) {
    return null;
  }
  return db.collection("complaints").findOne({ _id: new ObjectId(id) });
}

function canCitizenAccessComplaint(complaint, userId) {
  return complaint && complaint.citizen_profile_id === userId;
}

function registerComplaintRoutes(app, db) {
  app.post("/complaints/:id/escalate", requireAuth, async (req, res) => {
    if (!isStaffRole(req.user.role)) {
      return res.status(403).send("Only staff can escalate complaints.");
    }

    const { id } = req.params;
    const { note, internalNotes } = req.body || {};
    const complaint = await loadComplaint(db, id);
    if (!complaint) {
      return res.status(404).send("Complaint not found");
    }

    const update = buildComplaintUpdate("escalated", complaint.resolution_note, complaint.resolution_details);
    if (internalNotes !== undefined) {
      update.internal_notes = internalNotes || null;
    }
    if (note !== undefined) {
      const noteUpdate = buildOperatorNoteUpdate(complaint.operator_note, note);
      if (noteUpdate) {
        Object.assign(update, noteUpdate);
      }
    }

    await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $set: update },
    );

    await db.collection("complaint_timeline").insertOne({
      complaint_id: id,
      actor_profile_id: req.user.id,
      old_status: complaint.status || null,
      new_status: "escalated",
      note: note || "Operator escalated the complaint for leadership review",
      created_at: new Date().toISOString(),
    });

    await db.collection("audit_logs").insertOne({
      actor_profile_id: req.user.id,
      action: "escalate_complaint",
      entity_type: "complaints",
      entity_id: id,
      metadata: {
        note: note || null,
        internal_notes: internalNotes || null,
      },
      created_at: new Date().toISOString(),
    });

    const updated = await loadComplaint(db, id);
    await createComplaintNotifications(
      db,
      updated,
      "Complaint escalated",
      `Complaint #${updated.complaint_number ?? updated._id.toString()} has been escalated for leadership review.`,
    );

    return res.json(toComplaintResponse(updated));
  });

  app.post("/complaints", requireAuth, async (req, res) => {
    const payload = req.body || {};
    const now = new Date().toISOString();
    const complaintNumber = await nextComplaintNumber(db);
    const isCitizenCreated = req.user.role === "citizen";
    const citizenProfileId = isCitizenCreated
      ? req.user.id
      : payload.citizen_profile_id ?? payload.created_on_behalf_of_citizen_id ?? null;
    const voter = citizenProfileId
      ? await db.collection("voters").findOne({ profile_id: citizenProfileId })
      : null;
    const creationNote = isCitizenCreated
      ? "Complaint submitted by citizen."
      : citizenProfileId
        ? "Complaint created by operator on behalf of citizen."
        : "Complaint created by operator for walk-in citizen.";

    const complaint = {
      complaint_number: complaintNumber,
      citizen_profile_id: citizenProfileId,
      voter_id: payload.voter_id ?? voter?.voter_id ?? null,
      submitted_by: req.user.id,
      created_by_role: req.user.role,
      created_by_user_id: req.user.id,
      created_on_behalf_of_citizen_id: isCitizenCreated ? null : citizenProfileId,
      source: isCitizenCreated ? "citizen" : "operator",
      reported_citizen_name: payload.reported_citizen_name ?? null,
      reported_citizen_mobile: payload.reported_citizen_mobile ?? null,
      category: payload.category ?? null,
      sub_category: payload.sub_category ?? null,
      description: payload.description ?? null,
      location_text: payload.location_text ?? null,
      attachment_url: payload.attachment_url ?? null,
      assigned_department_id: payload.assigned_department_id ?? null,
      priority: payload.priority ?? "normal",
      status: payload.status && VALID_STATUSES.has(payload.status) ? payload.status : "unassigned",
      internal_notes: payload.internal_notes ?? null,
      operator_note: payload.operator_note ?? null,
      operator_note_updated_at: payload.operator_note ? now : null,
      resolution_details: payload.resolution_details ?? null,
      resolution_note: payload.resolution_note ?? null,
      expected_resolution_at: payload.expected_resolution_at ?? null,
      resolved_at: null,
      reopened_at: null,
      closed_at: null,
      created_at: now,
      updated_at: now,
    };

    const result = await db.collection("complaints").insertOne(complaint);

    await db.collection("complaint_timeline").insertOne({
      complaint_id: result.insertedId.toString(),
      actor_profile_id: req.user.id,
      old_status: null,
      new_status: complaint.status,
      note: creationNote,
      created_at: now,
    });

    await db.collection("audit_logs").insertOne({
      actor_profile_id: req.user.id,
      action: "create_complaint",
      entity_type: "complaints",
      entity_id: result.insertedId.toString(),
      metadata: {
        complaint_number: complaintNumber,
        category: complaint.category,
        source: complaint.source,
        created_by_role: complaint.created_by_role,
        citizen_profile_id: citizenProfileId,
        reported_citizen_name: complaint.reported_citizen_name,
      },
      created_at: now,
    });

    const created = await loadComplaint(db, result.insertedId.toString());
    return res.json(toComplaintResponse(created));
  });

  app.get("/complaints/me", requireAuth, async (req, res) => {
    const data = await db
      .collection("complaints")
      .find({ citizen_profile_id: req.user.id })
      .sort({ created_at: -1 })
      .toArray();
    return res.json(toComplaintResponses(data));
  });

  app.get("/complaints", requireAuth, async (req, res) => {
    const filter = req.user.role === "citizen" ? { citizen_profile_id: req.user.id } : {};
    const data = await db.collection("complaints").find(filter).sort({ created_at: -1 }).toArray();
    return res.json(toComplaintResponses(data));
  });

  app.get("/complaints/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const complaint = await loadComplaint(db, id);
    if (!complaint) {
      return res.status(404).send("Complaint not found");
    }
    if (req.user.role === "citizen" && !canCitizenAccessComplaint(complaint, req.user.id)) {
      return res.status(403).send("Not allowed to view this complaint.");
    }
    return res.json(toComplaintResponse(complaint));
  });

  app.get("/complaints/:id/timeline", requireAuth, async (req, res) => {
    const { id } = req.params;
    const complaint = await loadComplaint(db, id);
    if (!complaint) {
      return res.status(404).send("Complaint not found");
    }
    if (req.user.role === "citizen" && !canCitizenAccessComplaint(complaint, req.user.id)) {
      return res.status(403).send("Not allowed to view this complaint timeline.");
    }
    const timeline = await db
      .collection("complaint_timeline")
      .find({ complaint_id: id })
      .sort({ created_at: 1 })
      .toArray();
    return res.json(timeline.map(toPublicDoc));
  });

  app.post("/complaints/:id/assign", requireAuth, async (req, res) => {
    if (!isStaffRole(req.user.role)) {
      return res.status(403).send("Only staff can assign complaints.");
    }

    const { id } = req.params;
    const complaint = await loadComplaint(db, id);
    if (!complaint) {
      return res.status(404).send("Complaint not found");
    }

    const {
      assignedDepartmentId,
      priority,
      note,
      expectedResolutionAt,
      expected_resolution_at,
      internalNotes,
    } = req.body || {};

    if (!assignedDepartmentId) {
      return res.status(400).send("Missing assignedDepartmentId");
    }

    const priorityValue = priority ?? complaint.priority ?? "normal";
    const defaultHours =
      priorityValue === "critical" ? 24 : priorityValue === "urgent" ? 24 * 3 : 24 * 7;
    const expectedResolutionValue =
      expectedResolutionAt ||
      expected_resolution_at ||
      new Date(Date.now() + defaultHours * 60 * 60 * 1000).toISOString();
    const department = isValidObjectId(assignedDepartmentId)
      ? await db.collection("departments").findOne({
          _id: new ObjectId(assignedDepartmentId),
        })
      : null;

    const nextStatus =
      complaint.status === "in_progress" ||
      complaint.status === "resolved" ||
      complaint.status === "closed"
        ? complaint.status
        : "assigned";

    const updates = {
      assigned_department_id: assignedDepartmentId,
      priority: priorityValue,
      expected_resolution_at: expectedResolutionValue,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (internalNotes !== undefined) {
      updates.internal_notes = internalNotes || null;
    }

    const noteUpdate = note !== undefined ? buildOperatorNoteUpdate(complaint.operator_note, note) : null;
    if (noteUpdate) {
      Object.assign(updates, noteUpdate);
    }

    const hasChanges = hasAnyChange(complaint, updates, [
      "assigned_department_id",
      "priority",
      "expected_resolution_at",
      "status",
      "internal_notes",
      "operator_note",
      "operator_note_updated_at",
    ]);

    if (!hasChanges) {
      return res.json(toComplaintResponse(complaint));
    }

    await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates },
    );

    await db.collection("audit_logs").insertOne({
      actor_profile_id: req.user.id,
      action: "assign_complaint",
      entity_type: "complaints",
      entity_id: id,
      metadata: {
        department_id: assignedDepartmentId,
        department_name: department?.name ?? null,
        priority: priorityValue,
        expected_resolution_at: expectedResolutionValue,
        note: note || null,
        internal_notes: internalNotes || null,
      },
      created_at: new Date().toISOString(),
    });

    await db.collection("complaint_timeline").insertOne({
      complaint_id: id,
      actor_profile_id: req.user.id,
      old_status: complaint.status || null,
      new_status: nextStatus,
      note: note || "Complaint assigned to department by operator",
      created_at: new Date().toISOString(),
    });

    const updated = await loadComplaint(db, id);
    await createComplaintNotifications(
      db,
      updated,
      "Complaint assigned",
      `Complaint #${updated.complaint_number ?? updated._id.toString()} has been assigned to a department.`,
    );

    return res.json(toComplaintResponse(updated));
  });

  app.post("/complaints/:id/details", requireAuth, async (req, res) => {
    if (!isStaffRole(req.user.role)) {
      return res.status(403).send("Only staff can update complaint details.");
    }

    const { id } = req.params;
    const complaint = await loadComplaint(db, id);
    if (!complaint) {
      return res.status(404).send("Complaint not found");
    }
    if (complaint.source === "citizen") {
      return res
        .status(403)
        .send("Citizen-submitted complaint details cannot be edited by operators.");
    }

    const {
      category,
      subCategory,
      sub_category,
      description,
      locationText,
      location_text,
      internalNotes,
      resolutionDetails,
      resolution_details,
      reportedCitizenName,
      reported_citizen_name,
      reportedCitizenMobile,
      reported_citizen_mobile,
      citizenProfileId,
      citizen_profile_id,
      note,
    } = req.body || {};

    const updates = { updated_at: new Date().toISOString() };

    if (category !== undefined) {
      updates.category = category || null;
    }
    if (subCategory !== undefined || sub_category !== undefined) {
      updates.sub_category = subCategory ?? sub_category ?? null;
    }
    if (description !== undefined) {
      updates.description = description || null;
    }
    if (locationText !== undefined || location_text !== undefined) {
      updates.location_text = locationText ?? location_text ?? null;
    }
    if (internalNotes !== undefined) {
      updates.internal_notes = internalNotes || null;
    }
    if (resolutionDetails !== undefined || resolution_details !== undefined) {
      updates.resolution_details = resolutionDetails ?? resolution_details ?? null;
    }
    if (reportedCitizenName !== undefined || reported_citizen_name !== undefined) {
      updates.reported_citizen_name = reportedCitizenName ?? reported_citizen_name ?? null;
    }
    if (reportedCitizenMobile !== undefined || reported_citizen_mobile !== undefined) {
      updates.reported_citizen_mobile = reportedCitizenMobile ?? reported_citizen_mobile ?? null;
    }
    if (citizenProfileId !== undefined || citizen_profile_id !== undefined) {
      const nextCitizenId = citizenProfileId ?? citizen_profile_id ?? null;
      updates.citizen_profile_id = nextCitizenId;
      updates.created_on_behalf_of_citizen_id =
        complaint.source === "operator" ? nextCitizenId : complaint.created_on_behalf_of_citizen_id ?? null;
    }
    if (note !== undefined) {
      const noteUpdate = buildOperatorNoteUpdate(complaint.operator_note, note);
      if (noteUpdate) {
        Object.assign(updates, noteUpdate);
      }
    }

    const changedKeys = Object.keys(updates).filter(key => key !== "updated_at");
    const hasChanges = hasAnyChange(complaint, updates, changedKeys);
    if (!hasChanges) {
      return res.json(toComplaintResponse(complaint));
    }

    if (!changedKeys.length) {
      return res.status(400).send("No complaint details provided.");
    }

    await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $set: updates },
    );

    await db.collection("complaint_timeline").insertOne({
      complaint_id: id,
      actor_profile_id: req.user.id,
      old_status: complaint.status || null,
      new_status: complaint.status || null,
      note: note || "Operator updated complaint details",
      created_at: new Date().toISOString(),
    });

    await db.collection("audit_logs").insertOne({
      actor_profile_id: req.user.id,
      action: "update_complaint_details",
      entity_type: "complaints",
      entity_id: id,
      metadata: { fields: changedKeys },
      created_at: new Date().toISOString(),
    });

    const updated = await loadComplaint(db, id);
    return res.json(toComplaintResponse(updated));
  });

  app.post("/complaints/:id/status", requireAuth, async (req, res) => {
    if (!isStaffRole(req.user.role)) {
      return res.status(403).send("Only staff can update complaint status.");
    }

    const { id } = req.params;
    const {
      status,
      note,
      internalNotes,
      resolutionDetails,
      resolutionNote,
    } = req.body || {};

    if (!VALID_STATUSES.has(status)) {
      return res.status(400).send("Invalid complaint status.");
    }

    const existing = await loadComplaint(db, id);
    if (!existing) {
      return res.status(404).send("Complaint not found");
    }

    const update = buildComplaintUpdate(
      status,
      resolutionNote !== undefined ? resolutionNote : existing.resolution_note,
      resolutionDetails !== undefined ? resolutionDetails : existing.resolution_details,
    );

    if (internalNotes !== undefined) {
      update.internal_notes = internalNotes || null;
    }
    if (resolutionNote !== undefined) {
      update.resolution_note = resolutionNote || null;
    }
    if (resolutionDetails !== undefined) {
      update.resolution_details = resolutionDetails || null;
    }
    if (note !== undefined) {
      const noteUpdate = buildOperatorNoteUpdate(existing.operator_note, note);
      if (noteUpdate) {
        Object.assign(update, noteUpdate);
      }
    }

    const hasChanges = hasAnyChange(existing, update, [
      "status",
      "resolution_note",
      "resolution_details",
      "internal_notes",
      "operator_note",
      "operator_note_updated_at",
    ]);
    if (!hasChanges) {
      return res.json(toComplaintResponse(existing));
    }

    await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $set: update },
    );

    await db.collection("complaint_timeline").insertOne({
      complaint_id: id,
      actor_profile_id: req.user.id,
      old_status: existing.status || null,
      new_status: status,
      note: note || defaultTimelineNote(status, req.user.role),
      created_at: new Date().toISOString(),
    });

    await db.collection("audit_logs").insertOne({
      actor_profile_id: req.user.id,
      action: "update_complaint_status",
      entity_type: "complaints",
      entity_id: id,
      metadata: {
        old_status: existing.status || null,
        new_status: status,
        note: note || null,
      },
      created_at: new Date().toISOString(),
    });

    const updated = await loadComplaint(db, id);
    await createComplaintNotifications(
      db,
      updated,
      "Complaint status updated",
      `Complaint #${updated.complaint_number ?? updated._id.toString()} is now ${status.replace(/_/g, " ")}.`,
    );

    return res.json(toComplaintResponse(updated));
  });

  async function handleComplaintFeedback(req, res) {
    const { id } = req.params;
    const { satisfied, note } = req.body || {};
    if (typeof satisfied !== "boolean") {
      return res.status(400).send("Missing satisfied boolean");
    }

    const complaint = await loadComplaint(db, id);
    if (!complaint) {
      return res.status(404).send("Complaint not found");
    }
    if (req.user.role === "citizen" && !canCitizenAccessComplaint(complaint, req.user.id)) {
      return res.status(403).send("Not allowed to update this complaint.");
    }
    if (complaint.status !== "resolved" || !complaint.resolved_at) {
      return res
        .status(400)
        .send("Citizen can only confirm or request reopening after the complaint is resolved.");
    }

    const nextStatus = satisfied ? "closed" : "reopened";
    if (complaint.status === nextStatus) {
      return res.json(toComplaintResponse(complaint));
    }
    const update = buildComplaintUpdate(nextStatus, complaint.resolution_note, complaint.resolution_details);

    await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $set: update },
    );

    await db.collection("complaint_timeline").insertOne({
      complaint_id: id,
      actor_profile_id: req.user.id,
      old_status: complaint.status || null,
      new_status: nextStatus,
      note: satisfied
        ? (note || "Citizen confirmed resolution")
        : (note || "Citizen requested reopening"),
      satisfied,
      created_at: new Date().toISOString(),
    });

    const updated = await loadComplaint(db, id);
    await createComplaintNotifications(
      db,
      updated,
      "Complaint feedback received",
      `Complaint #${updated.complaint_number ?? updated._id.toString()} has been ${nextStatus}.`,
    );

    return res.json(toComplaintResponse(updated));
  }

  app.post("/complaints/:id/citizen-feedback", requireAuth, handleComplaintFeedback);
  app.post("/complaints/:id/feedback", requireAuth, handleComplaintFeedback);

  app.post("/complaints/:id/reopen", requireAuth, async (req, res) => {
    const { id } = req.params;
    const complaint = await loadComplaint(db, id);
    if (!complaint || complaint.status !== "resolved" || !complaint.resolved_at) {
      return res.status(400).send("Only resolved complaints can be reopened.");
    }
    if (req.user.role === "citizen" && !canCitizenAccessComplaint(complaint, req.user.id)) {
      return res.status(403).send("Not allowed to reopen this complaint.");
    }

    const reopenWindow = new Date(complaint.resolved_at);
    reopenWindow.setDate(reopenWindow.getDate() + 7);
    if (new Date() > reopenWindow) {
      return res.status(400).send("Reopen window expired. Contact support.");
    }

    if (complaint.status === "reopened") {
      return res.json(toComplaintResponse(complaint));
    }

    await db.collection("complaints").updateOne(
      { _id: new ObjectId(id) },
      { $set: buildComplaintUpdate("reopened", complaint.resolution_note, complaint.resolution_details) },
    );

    await db.collection("complaint_timeline").insertOne({
      complaint_id: id,
      actor_profile_id: req.user.id,
      old_status: "resolved",
      new_status: "reopened",
      note: "Citizen requested reopening",
      created_at: new Date().toISOString(),
    });

    const updated = await loadComplaint(db, id);
    await createComplaintNotifications(
      db,
      updated,
      "Complaint reopened",
      `Complaint #${updated.complaint_number ?? updated._id.toString()} has been reopened.`,
    );

    return res.json(toComplaintResponse(updated));
  });
}

module.exports = { registerComplaintRoutes };
