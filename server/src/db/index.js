const { MongoClient } = require("mongodb");
const { seedDepartments, seedAdmin } = require("./seed");

let db;

async function connectDb({ MONGODB_URI, ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME }) {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();
  await seedDepartments(db);
  await seedAdmin(db, { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD, ADMIN_SEED_NAME });
  console.log("MongoDB connected");
  return db;
}

function getDb() {
  if (!db) throw new Error("Database not initialized");
  return db;
}

module.exports = { connectDb, getDb };
