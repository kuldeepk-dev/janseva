const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc, toPublicDocs } = require("../utils/serializers");
const { nextComplaintNumber } = require("../utils/complaints");
const { refreshOfficerCountsForComplaint } = require("./officer");

async function createComplaintNotifications(db, complaint, title, body) {
    if (!complaint) return;
    const now = new Date().toISOString();
    const notifications = [];

    if (complaint.citizen_profile_id) {
        notifications.push({
            recipient_profile_id: complaint.citizen_profile_id,
            recipient_role: "citizen",
            title,
            body,
            entity_type: "complaint",
            entity_id: complaint._id.toString(),
            created_at: now,
            read_at: null,
        });
    }

    if (complaint.assigned_officer_id) {
        notifications.push({
            recipient_profile_id: complaint.assigned_officer_id,
            recipient_role: "officer",
            title,
            body,
            entity_type: "complaint",
            entity_id: complaint._id.toString(),
            created_at: now,
            read_at: null,
        });
    }

    if (notifications.length) {
        await db.collection("notifications").insertMany(notifications);
    }
}

function registerComplaintRoutes(app, db) {
    function buildComplaintUpdate(status, note) {
        const now = new Date().toISOString();
        const update = { status, updated_at: now };

        if (status === "resolved") {
            update.resolution_note = note || null;
            update.resolved_at = now;
        }

        if (status === "closed") {
            update.closed_at = now;
        }

        if (status === "reopened") {
            update.reopened_at = now;
        }

        return update;
    }

    // Officer sub-assign: assign to another officer within department
    app.post("/complaints/:id/subassign", requireAuth, async (req, res) => {
        const { id } = req.params;
        const { officerId, note } = req.body || {};
        if (!officerId) return res.status(400).send("Missing officerId");
        const complaint = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        if (!complaint) return res.status(404).send("Complaint not found");
        await db.collection("complaints").updateOne(
            { _id: new ObjectId(id) },
            { $set: { assigned_officer_id: officerId, status: "assigned", updated_at: new Date().toISOString() } }
        );
        await db.collection("complaint_timeline").insertOne({
            complaint_id: id,
            actor_profile_id: req.user.id,
            old_status: complaint.status || null,
            new_status: "assigned",
            note: note || "Sub-assigned to officer",
            created_at: new Date().toISOString(),
        });
        const updated = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        await refreshOfficerCountsForComplaint(db, updated);
        await createComplaintNotifications(
            db,
            updated,
            "Complaint reassigned",
            `Your complaint #${updated.complaint_number ?? updated._id.toString()} has been reassigned to a new officer.`,
        );
        return res.json(toPublicDoc(updated));
    });

    // Officer escalate: escalate to senior/admin
    app.post("/complaints/:id/escalate", requireAuth, async (req, res) => {
        const { id } = req.params;
        const { note } = req.body || {};
        const complaint = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        if (!complaint) return res.status(404).send("Complaint not found");
        await db.collection("complaints").updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: "escalated", updated_at: new Date().toISOString() } }
        );
        await db.collection("complaint_timeline").insertOne({
            complaint_id: id,
            actor_profile_id: req.user.id,
            old_status: complaint.status || null,
            new_status: "escalated",
            note: note || "Escalated to senior",
            created_at: new Date().toISOString(),
        });
        // TODO: notify admin/leader
        const updated = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        await refreshOfficerCountsForComplaint(db, updated);
        await createComplaintNotifications(
            db,
            updated,
            "Complaint escalated",
            `Your complaint #${updated.complaint_number ?? updated._id.toString()} has been escalated for further review.`,
        );
        return res.json(toPublicDoc(updated));
    });

    app.post("/complaints", requireAuth, async (req, res) => {
        const payload = req.body || {};
        const now = new Date().toISOString();
        const complaintNumber = await nextComplaintNumber(db);
        const citizenProfileId = payload.citizen_profile_id ?? req.user.id;
        const voter = await db.collection("voters").findOne({
            profile_id: citizenProfileId,
        });
        const complaint = {
            ...payload,
            complaint_number: complaintNumber,
            citizen_profile_id: citizenProfileId,
            voter_id: payload.voter_id ?? voter?.voter_id ?? null,
            submitted_by: payload.submitted_by ?? req.user.id,
            status: "unassigned",
            created_at: now,
            updated_at: now,
        };
        const result = await db.collection("complaints").insertOne(complaint);

        await db.collection("complaint_timeline").insertOne({
            complaint_id: result.insertedId.toString(),
            actor_profile_id: req.user.id,
            old_status: null,
            new_status: "unassigned",
            note: "Complaint submitted",
            created_at: now,
        });

        const created = await db.collection("complaints").findOne({ _id: result.insertedId });
        return res.json(toPublicDoc(created));
    });

    app.get("/complaints/me", requireAuth, async (req, res) => {
        const data = await db.collection("complaints").find({ citizen_profile_id: req.user.id }).sort({ created_at: -1 }).toArray();
        return res.json(toPublicDocs(data));
    });

    app.get("/complaints", requireAuth, async (req, res) => {
        const data = await db.collection("complaints").find().sort({ created_at: -1 }).toArray();
        return res.json(toPublicDocs(data));
    });

    app.get("/complaints/:id", requireAuth, async (req, res) => {
        const { id } = req.params;
        const complaint = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        return res.json(toPublicDoc(complaint));
    });

    app.get("/complaints/:id/timeline", requireAuth, async (req, res) => {
        const { id } = req.params;
        const timeline = await db
            .collection("complaint_timeline")
            .find({ complaint_id: id })
            .sort({ created_at: 1 })
            .toArray();
        return res.json(toPublicDocs(timeline));
    });

    app.post("/complaints/:id/assign", requireAuth, async (req, res) => {
        const { id } = req.params;
        const { assignedDepartmentId, priority, note } = req.body || {};
        const hours = priority === "critical" ? 24 : priority === "urgent" ? 24 * 3 : 24 * 7;
        const expectedResolutionAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

        await db.collection("complaints").updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    assigned_department_id: assignedDepartmentId,
                    priority,
                    expected_resolution_at: expectedResolutionAt,
                    status: "assigned",
                    updated_at: new Date().toISOString(),
                },
            }
        );

        await db.collection("audit_logs").insertOne({
            actor_profile_id: req.user.id,
            action: "assign_complaint",
            entity_type: "complaints",
            entity_id: id,
            metadata: { department_id: assignedDepartmentId, priority, note: note || null },
            created_at: new Date().toISOString(),
        });

        await db.collection("complaint_timeline").insertOne({
            complaint_id: id,
            actor_profile_id: req.user.id,
            old_status: "unassigned",
            new_status: "assigned",
            note: note || "Assigned to department",
            created_at: new Date().toISOString(),
        });

        const updated = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        await refreshOfficerCountsForComplaint(db, updated);
        await createComplaintNotifications(
            db,
            updated,
            "Complaint assigned",
            `Complaint #${updated.complaint_number ?? updated._id.toString()} has been assigned and is now ${updated.status ?? "updated"}.`,
        );
        return res.json(toPublicDoc(updated));
    });

    app.post("/complaints/:id/status", requireAuth, async (req, res) => {
        const { id } = req.params;
        const { status, note } = req.body || {};
        const existing = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        if (!existing) return res.status(404).send("Complaint not found");

        const update = buildComplaintUpdate(status, note);

        await db.collection("complaints").updateOne({ _id: new ObjectId(id) }, { $set: update });
        await db.collection("complaint_timeline").insertOne({
            complaint_id: id,
            actor_profile_id: req.user.id,
            old_status: existing.status || null,
            new_status: status,
            note: note || null,
            created_at: new Date().toISOString(),
        });
        const updated = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        await refreshOfficerCountsForComplaint(db, updated);
        await createComplaintNotifications(
            db,
            updated,
            "Complaint status updated",
            `Complaint #${updated.complaint_number ?? updated._id.toString()} has been marked ${status.replace(/_/g, " ")}.`,
        );
        return res.json(toPublicDoc(updated));
    });

    app.post("/complaints/:id/feedback", requireAuth, async (req, res) => {
        const { id } = req.params;
        const { satisfied, note } = req.body || {};
        if (typeof satisfied !== "boolean") {
            return res.status(400).send("Missing satisfied boolean");
        }

        const complaint = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        if (!complaint) return res.status(404).send("Complaint not found");

        const nextStatus = satisfied ? "closed" : "reopened";
        const update = buildComplaintUpdate(nextStatus, note);

        await db.collection("complaints").updateOne({ _id: new ObjectId(id) }, { $set: update });
        await db.collection("complaint_timeline").insertOne({
            complaint_id: id,
            actor_profile_id: req.user.id,
            old_status: complaint.status || null,
            new_status: nextStatus,
            note: satisfied ? (note || "Citizen confirmed resolution") : (note || "Citizen reopened complaint"),
            satisfied,
            created_at: new Date().toISOString(),
        });

        const updated = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        await refreshOfficerCountsForComplaint(db, updated);
        await createComplaintNotifications(
            db,
            updated,
            "Complaint feedback received",
            `Complaint #${updated.complaint_number ?? updated._id.toString()} has been ${nextStatus === "closed" ? "resolved and closed" : "reopened"}.`,
        );
        return res.json(toPublicDoc(updated));
    });

    app.post("/complaints/:id/reopen", requireAuth, async (req, res) => {
        const { id } = req.params;
        const complaint = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        if (!complaint || complaint.status !== "resolved" || !complaint.resolved_at) return res.status(400).send("Only resolved complaints can be reopened.");

        const reopenWindow = new Date(complaint.resolved_at);
        reopenWindow.setDate(reopenWindow.getDate() + 7);
        if (new Date() > reopenWindow) return res.status(400).send("Reopen window expired. Contact support.");

        await db.collection("complaints").updateOne(
            { _id: new ObjectId(id) },
            { $set: buildComplaintUpdate("reopened", "Citizen reopened complaint") }
        );

        await db.collection("complaint_timeline").insertOne({
            complaint_id: id,
            actor_profile_id: req.user.id,
            old_status: "resolved",
            new_status: "reopened",
            note: "Citizen reopened complaint",
            created_at: new Date().toISOString(),
        });
        const updated = await db.collection("complaints").findOne({ _id: new ObjectId(id) });
        await createComplaintNotifications(
            db,
            updated,
            "Complaint reopened",
            `Complaint #${updated.complaint_number ?? updated._id.toString()} has been reopened.`,
        );
        return res.json(toPublicDoc(updated));
    });
}

module.exports = { registerComplaintRoutes };
