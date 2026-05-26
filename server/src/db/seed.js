const bcrypt = require("bcryptjs");

async function seedDepartments(db) {
  const collection = db.collection("departments");
  const existing = await collection.countDocuments();
  if (existing > 0) return;

  await collection.insertMany([
    { name: "Block Education Office", category: "Education", created_at: new Date().toISOString() },
    { name: "Police Station / Dist. SP Office", category: "Law & Order", created_at: new Date().toISOString() },
    { name: "Agriculture Extension Office", category: "Agriculture", created_at: new Date().toISOString() },
    { name: "District Employment Office / MNREGA Cell", category: "Job & Employment", created_at: new Date().toISOString() },
    { name: "PHC / District Health Office", category: "Health", created_at: new Date().toISOString() },
    { name: "PWD Block Office / DISCOM", category: "Infrastructure", created_at: new Date().toISOString() },
    { name: "Revenue / Tehsil Office", category: "Land Dispute", created_at: new Date().toISOString() },
    { name: "Social Welfare Department", category: "Personal / Social", created_at: new Date().toISOString() },
    { name: "Admin Review Queue", category: "Other", created_at: new Date().toISOString() }
  ]);
}

async function seedAdmin(db, { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME }) {
  if (!ADMIN_SEED_EMAIL || !ADMIN_SEED_PASSWORD) return;

  const staffCollection = db.collection("staff_users");
  const profileCollection = db.collection("profiles");
  const existing = await staffCollection.findOne({ email: ADMIN_SEED_EMAIL });
  if (existing) return;

  const now = new Date().toISOString();
  const profileResult = await profileCollection.insertOne({
    role: "admin",
    full_name: ADMIN_SEED_NAME,
    mobile: null,
    email: ADMIN_SEED_EMAIL,
    preferred_language: "en",
    created_at: now,
    updated_at: now,
  });

  const passwordHash = await bcrypt.hash(ADMIN_SEED_PASSWORD, 10);
  await staffCollection.insertOne({
    email: ADMIN_SEED_EMAIL,
    password_hash: passwordHash,
    role: "admin",
    profile_id: profileResult.insertedId,
    created_at: now,
    updated_at: now,
  });

  console.log("Seeded admin staff user");
}

module.exports = { seedDepartments, seedAdmin };
