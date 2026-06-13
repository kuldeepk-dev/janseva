const { ObjectId } = require("mongodb");
const { requireAuth } = require("../middleware/auth");
const { toPublicDoc, toPublicDocs } = require("../utils/serializers");

function normalizeImageUrls(payload) {
  if (Array.isArray(payload.image_urls)) {
    return payload.image_urls.filter(Boolean);
  }

  if (payload.image_url) {
    return [payload.image_url];
  }

  return [];
}

function registerSocialPostRoutes(app, db) {
  app.get("/social-posts/published", async (req, res) => {
    const data = await db.collection("social_posts").find({ status: "published" }).sort({ published_at: -1 }).toArray();
    return res.json(toPublicDocs(data));
  });

  app.post("/social-posts", requireAuth, async (req, res) => {
    const payload = req.body || {};
    const imageUrls = normalizeImageUrls(payload);
    if (imageUrls.length > 5) {
      return res.status(400).send("A maximum of 5 images can be attached to a social post.");
    }
    const cappedImageUrls = imageUrls.slice(0, 5);
    const now = new Date().toISOString();
    const post = {
      ...payload,
      image_urls: cappedImageUrls.length ? cappedImageUrls : null,
      image_url: cappedImageUrls[0] ?? null,
      author_profile_id: req.user.id,
      created_at: now,
      updated_at: now,
    };
    const result = await db.collection("social_posts").insertOne(post);
    const created = await db.collection("social_posts").findOne({ _id: result.insertedId });
    return res.json(toPublicDoc(created));
  });

  app.post("/social-posts/:id/publish", requireAuth, async (req, res) => {
    const { id } = req.params;
    await db.collection("social_posts").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: "published", published_at: new Date().toISOString(), updated_at: new Date().toISOString() } }
    );
    const updated = await db.collection("social_posts").findOne({ _id: new ObjectId(id) });
    return res.json(toPublicDoc(updated));
  });

  app.get("/social-posts/pending", requireAuth, async (req, res) => {
    const data = await db.collection("social_posts").find({ status: "pending_approval" }).sort({ created_at: -1 }).toArray();
    return res.json(toPublicDocs(data));
  });
}

module.exports = { registerSocialPostRoutes };
