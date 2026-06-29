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
    { name: "Admin Review Queue", category: "Other", created_at: new Date().toISOString() },
  ]);
}

async function seedDemoComplaints(db) {
  const complaintCollection = db.collection("complaints");
  const existing = await complaintCollection.countDocuments();
  if (existing > 0) return;

  const departments = await db.collection("departments").find().toArray();
  if (!departments.length) return;

  const departmentMap = new Map(departments.map(item => [item.name, item._id.toString()]));
  const now = new Date();
  const daysAgo = days => {
    const date = new Date(now);
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };
  const daysAhead = days => {
    const date = new Date(now);
    date.setDate(date.getDate() + days);
    return date.toISOString();
  };

  const demoRows = [
    {
      category: "Infrastructure",
      sub_category: "Road Repair",
      description: "Pothole near school entrance",
      location_text: "Ward 4",
      department_name: "PWD Block Office / DISCOM",
      status: "assigned",
      created_at: daysAgo(5),
      updated_at: daysAgo(5),
    },
    {
      category: "Health",
      sub_category: "Medicine Shortage",
      description: "PHC does not have essential medicines",
      location_text: "Village Center",
      department_name: "PHC / District Health Office",
      status: "in_progress",
      created_at: daysAgo(4),
      updated_at: daysAgo(3),
    },
    {
      category: "Education",
      sub_category: "Teacher Vacancy",
      description: "School has two vacant teacher posts",
      location_text: "Block A",
      department_name: "Block Education Office",
      status: "escalated",
      created_at: daysAgo(3),
      updated_at: daysAgo(1),
    },
    {
      category: "Law & Order",
      sub_category: "Noise Complaint",
      description: "Repeated loud gatherings late at night",
      location_text: "Market Road",
      department_name: "Police Station / Dist. SP Office",
      status: "resolved",
      created_at: daysAgo(2),
      updated_at: daysAgo(1),
    },
  ];

  const payloads = demoRows.map(row => ({
    complaint_number: null,
    citizen_profile_id: null,
    voter_id: null,
    submitted_by: null,
    created_by_role: "operator",
    created_by_user_id: null,
    created_on_behalf_of_citizen_id: null,
    source: "operator",
    reported_citizen_name: "Walk-in Citizen",
    reported_citizen_mobile: null,
    category: row.category,
    sub_category: row.sub_category,
    description: row.description,
    location_text: row.location_text,
    attachment_url: null,
    assigned_department_id: departmentMap.get(row.department_name) ?? null,
    priority: "normal",
    status: row.status,
    internal_notes: "Seeded operator-handled complaint",
    resolution_details: row.status === "resolved" ? "Marked resolved in demo seed." : null,
    resolution_note: row.status === "resolved" ? "Resolved during demo data generation." : null,
    expected_resolution_at: daysAhead(5),
    resolved_at: row.status === "resolved" ? daysAgo(1) : null,
    reopened_at: null,
    closed_at: null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));

  if (payloads.length) {
    await complaintCollection.insertMany(payloads);
  }
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

async function seedDemoStaff(db, { DEMO_STAFF_SEED_ENABLED, DEMO_STAFF_PASSWORD }) {
  if (!DEMO_STAFF_SEED_ENABLED || !DEMO_STAFF_PASSWORD) return;

  const staffCollection = db.collection("staff_users");
  const profileCollection = db.collection("profiles");
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(DEMO_STAFF_PASSWORD, 10);

  const demoAccounts = [
    { role: "operator", email: "operator@janseva.local", name: "Demo Operator" },
    {
      role: "booth_worker",
      email: "boothworker@janseva.local",
      name: "Demo Booth Worker",
      assigned_booth_number: "12",
    },
    { role: "leader", email: "leader@janseva.local", name: "Demo Leader" },
    { role: "admin", email: "admin@janseva.local", name: "Demo Admin" },
  ];

  for (const account of demoAccounts) {
    const existing = await staffCollection.findOne({ email: account.email });
    if (existing) continue;

    const profileResult = await profileCollection.insertOne({
      role: account.role,
      full_name: account.name,
      mobile: null,
      email: account.email,
      preferred_language: "en",
      assigned_booth_number: account.assigned_booth_number ?? null,
      total_complaints_assigned: 0,
      pending_complaints: 0,
      created_at: now,
      updated_at: now,
    });

    await staffCollection.insertOne({
      email: account.email,
      password_hash: passwordHash,
      role: account.role,
      profile_id: profileResult.insertedId,
      created_at: now,
      updated_at: now,
    });
  }

  console.log("Ensured demo staff accounts");
}

module.exports = { seedDepartments, seedDemoComplaints, seedAdmin, seedDemoStaff };
