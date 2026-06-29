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

function isLeadershipRole(role) {
  return role === "leader";
}

function normalizePlatform(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
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

  app.post("/social-posts/:id/share-track", requireAuth, async (req, res) => {
    if (req.user.role !== "booth_worker") {
      return res.status(403).send("Only booth workers can track social post shares.");
    }

    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send("Invalid social post id.");
    }

    const platform = normalizePlatform(req.body?.platform);
    if (!platform) {
      return res.status(400).send("Platform is required.");
    }

    const post = await db.collection("social_posts").findOne({ _id: new ObjectId(id) });
    if (!post) {
      return res.status(404).send("Social post not found.");
    }

    const now = new Date().toISOString();
    await db.collection("social_post_share_tracking").updateOne(
      {
        post_id: id,
        booth_worker_profile_id: req.user.id,
        platform,
      },
      {
        $inc: { share_count: 1 },
        $set: {
          updated_at: now,
          booth_worker_role: req.user.role,
        },
        $setOnInsert: {
          post_id: id,
          booth_worker_profile_id: req.user.id,
          platform,
          created_at: now,
        },
      },
      { upsert: true },
    );

    const updated = await db.collection("social_post_share_tracking").findOne({
      post_id: id,
      booth_worker_profile_id: req.user.id,
      platform,
    });

    return res.json(toPublicDoc(updated));
  });

  app.get("/social-posts/share-tracking/report", requireAuth, async (req, res) => {
    if (!isLeadershipRole(req.user.role)) {
      return res.status(403).send("Only leaders can view the share tracking report.");
    }

    const rows = await db
      .collection("social_post_share_tracking")
      .find({})
      .sort({ share_count: -1, updated_at: -1 })
      .toArray();

    const profileIds = [...new Set(rows.map(row => row.booth_worker_profile_id).filter(Boolean))];
    const postIds = [...new Set(rows.map(row => row.post_id).filter(Boolean))];

    const profileObjectIds = profileIds.filter(ObjectId.isValid).map(id => new ObjectId(id));
    const postObjectIds = postIds.filter(ObjectId.isValid).map(id => new ObjectId(id));

    const [profiles, posts] = await Promise.all([
      profileObjectIds.length
        ? db.collection("profiles").find({ _id: { $in: profileObjectIds } }).toArray()
        : [],
      postObjectIds.length
        ? db.collection("social_posts").find({ _id: { $in: postObjectIds } }).toArray()
        : [],
    ]);

    const profileById = new Map(
      profiles.map(profile => [profile._id.toString(), profile]),
    );
    const postById = new Map(posts.map(post => [post._id.toString(), post]));

    return res.json(
      rows.map(row => {
        const profile = profileById.get(String(row.booth_worker_profile_id || ""));
        const post = postById.get(String(row.post_id || ""));
        const boothArea = profile?.assigned_booth_number
          ? `Booth ${profile.assigned_booth_number}`
          : "Unassigned";

        return {
          id: row._id.toString(),
          post_id: row.post_id ?? null,
          post_title: post?.title ?? post?.category ?? "Untitled post",
          booth_worker_profile_id: row.booth_worker_profile_id ?? null,
          booth_worker_name:
            profile?.full_name ?? profile?.email ?? "Unknown Booth Worker",
          booth_area: boothArea,
          platform: row.platform ?? null,
          share_count: Number(row.share_count ?? 0),
          updated_at: row.updated_at ?? row.created_at ?? null,
        };
      }),
    );
  });
}

module.exports = { registerSocialPostRoutes };
