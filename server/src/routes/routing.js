const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc, toPublicDocs } = require("../utils/serializers");

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function registerRoutingRoutes(app, db) {
    app.get("/routing-rules", requireAuth, async (req, res) => {
        const data = await db
            .collection("routing_rules")
            .find()
            .sort({ category: 1 })
            .toArray();
        return res.json(toPublicDocs(data));
    });

    app.post("/routing-rules", requireAuth, async (req, res) => {
        const { category, department_id, sla_days } = req.body || {};
        if (!category || typeof category !== "string" || !category.trim()) {
            return res.status(400).send("Missing category");
        }
        if (!department_id) {
            return res.status(400).send("Missing department_id");
        }
        const parsedSla = Number.isFinite(Number(sla_days)) ? Number(sla_days) : null;
        if (parsedSla === null) {
            return res.status(400).send("Invalid SLA days");
        }

        const now = new Date().toISOString();
        const payload = {
            category: category.trim(),
            department_id,
            sla_days: parsedSla,
            created_at: now,
            updated_at: now,
        };
        const result = await db.collection("routing_rules").insertOne(payload);
        const created = await db.collection("routing_rules").findOne({ _id: result.insertedId });
        return res.json(toPublicDoc(created));
    });

    app.put("/routing-rules/:id", requireAuth, async (req, res) => {
        const { id } = req.params;
        const { category, department_id, sla_days } = req.body || {};
        const updates = { updated_at: new Date().toISOString() };

        if (category !== undefined) {
            if (!category || typeof category !== "string" || !category.trim()) {
                return res.status(400).send("Invalid category");
            }
            updates.category = category.trim();
        }

        if (department_id !== undefined) {
            updates.department_id = department_id || null;
        }

        if (sla_days !== undefined) {
            const parsedSla = Number.isFinite(Number(sla_days)) ? Number(sla_days) : null;
            if (parsedSla === null) {
                return res.status(400).send("Invalid SLA days");
            }
            updates.sla_days = parsedSla;
        }

        await db.collection("routing_rules").updateOne({ _id: new ObjectId(id) }, { $set: updates });
        const updated = await db.collection("routing_rules").findOne({ _id: new ObjectId(id) });
        return res.json(toPublicDoc(updated));
    });

    app.post("/routing-rules/test", requireAuth, async (req, res) => {
        const { category } = req.body || {};
        if (!category || typeof category !== "string" || !category.trim()) {
            return res.status(400).send("Missing category");
        }
        const escaped = escapeRegex(category.trim());
        const rule = await db
            .collection("routing_rules")
            .findOne({ category: new RegExp(`^${escaped}$`, "i") });
        return res.json({ rule: rule ? toPublicDoc(rule) : null });
    });

    app.delete("/routing-rules/:id", requireAuth, async (req, res) => {
        const { id } = req.params;
        await db.collection("routing_rules").deleteOne({ _id: new ObjectId(id) });
        return res.json({ ok: true });
    });
}

module.exports = { registerRoutingRoutes };
