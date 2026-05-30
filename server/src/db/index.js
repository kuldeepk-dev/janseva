const { MongoClient } = require("mongodb");
const { seedDepartments, seedAdmin, seedDemoStaff } = require("./seed");

let db;

async function connectDb({
  MONGODB_URI,
  ADMIN_SEED_EMAIL,
  ADMIN_SEED_PASSWORD,
  ADMIN_SEED_NAME,
  SEED_DATA_ENABLED,
  DEMO_STAFF_SEED_ENABLED,
  DEMO_STAFF_PASSWORD,
}) {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();
  if (SEED_DATA_ENABLED) {
    await seedDepartments(db);
    await seedAdmin(db, { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME });
    await seedDemoStaff(db, { DEMO_STAFF_SEED_ENABLED, DEMO_STAFF_PASSWORD });
  }
  console.log("MongoDB connected");
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

module.exports = { connectDb, getDb };
