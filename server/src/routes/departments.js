const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc, toPublicDocs } = require("../utils/serializers");

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) return null;
  const cleaned = categories
    .map(item => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
  return cleaned.length ? cleaned : null;
}

function registerDepartmentRoutes(app, db) {
  app.get("/departments", requireAuth, async (req, res) => {
    const data = await db.collection("departments").find().sort({ name: 1 }).toArray();
    return res.json(toPublicDocs(data));
  });

  app.post("/departments", requireAuth, async (req, res) => {
    const { name, contact, sla_days, categories } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).send("Missing department name");
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
      name: name.trim(),
      contact: contact ?? null,
      sla_days: parsedSla,
      categories: normalizeCategories(categories),
      created_at: now,
      updated_at: now,
    };
    const result = await db.collection("departments").insertOne(payload);
    const created = await db.collection("departments").findOne({ _id: result.insertedId });
    return res.json(toPublicDoc(created));
  });

  app.put("/departments/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { name, contact, sla_days, categories } = req.body || {};
    const updates = { updated_at: new Date().toISOString() };

    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).send("Invalid department name");
      }
      updates.name = name.trim();
    }

    if (contact !== undefined) {
      updates.contact = contact || null;
    }

    if (sla_days !== undefined) {
      const parsedSla = Number.isFinite(Number(sla_days)) ? Number(sla_days) : null;
      if (parsedSla === null) {
        return res.status(400).send("Invalid SLA days");
      }
      updates.sla_days = parsedSla;
    }

    if (categories !== undefined) {
      updates.categories = normalizeCategories(categories);
    }

    await db.collection("departments").updateOne({ _id: new ObjectId(id) }, { $set: updates });
    const updated = await db.collection("departments").findOne({ _id: new ObjectId(id) });
    return res.json(toPublicDoc(updated));
  });
}

module.exports = { registerDepartmentRoutes };
