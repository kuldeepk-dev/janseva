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

function slugifyName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "");
}

async function seedOfficers(
  db,
  { OFFICER_SEED_PASSWORD, OFFICER_SEED_EMAIL_DOMAIN = "janseva.local" } = {},
) {
  const departments = await db.collection("departments").find().toArray();
  if (!departments.length || !OFFICER_SEED_PASSWORD) return;

  const departmentMap = new Map(departments.map(item => [item.name, item]));
  const collection = db.collection("officers");
  const profiles = db.collection("profiles");
  const staffUsers = db.collection("staff_users");
  const passwordHash = await bcrypt.hash(OFFICER_SEED_PASSWORD, 10);

  const officerGroups = {
    "Block Education Office": ["Rajesh Sharma", "Sunita Verma", "Anil Joshi"],
    "Police Station / Dist. SP Office": ["Vikram Singh", "Deepak Rathore", "Neha Choudhary"],
    "Agriculture Extension Office": ["Mahesh Meena", "Suresh Gurjar", "Kavita Yadav"],
    "District Employment Office / MNREGA Cell": ["Pankaj Sharma", "Priya Saxena", "Rohit Bansal"],
    "PHC / District Health Office": ["Dr. Amit Gupta", "Dr. Pooja Sharma", "Dr. Nitin Jain"],
    "PWD Block Office / DISCOM": ["Rakesh Kumar", "Manish Agarwal", "Shalini Mathur"],
    "Revenue / Tehsil Office": ["Ashok Kumar", "Mukesh Saini", "Rekha Sharma"],
    "Social Welfare Department": ["Meena Kumari", "Alok Srivastava", "Ritu Singh"],
    "Admin Review Queue": ["System Administrator", "Naveen Sharma", "Admin Officer"],
  };

  const now = new Date().toISOString();
  const payloads = [];

  for (const [departmentName, officerNames] of Object.entries(officerGroups)) {
    const department = departmentMap.get(departmentName);
    if (!department) continue;

    for (const fullName of officerNames) {
      const email = `${slugifyName(fullName)}@${OFFICER_SEED_EMAIL_DOMAIN}`;
      const existingProfile = await profiles.findOne({ email });
      let profileId = existingProfile?._id ?? null;

      if (!existingProfile) {
        const profileResult = await profiles.insertOne({
          role: "officer",
          full_name: fullName,
          mobile: null,
          email,
          preferred_language: "en",
          total_complaints_assigned: 0,
          pending_complaints: 0,
          created_at: now,
          updated_at: now,
        });
        profileId = profileResult.insertedId;
      }

      const existingStaff = await staffUsers.findOne({ email });
      if (!existingStaff) {
        await staffUsers.insertOne({
          email,
          password_hash: passwordHash,
          role: "officer",
          profile_id: profileId,
          created_at: now,
          updated_at: now,
        });
      }

      const existing = await collection.findOne({
        department_id: department._id.toString(),
        full_name: fullName,
      });
      if (existing) continue;

      payloads.push({
        department_id: department._id.toString(),
        profile_id: profileId,
        full_name: fullName,
        contact: null,
        sla_days: null,
        categories: null,
        total_complaints_assigned: 0,
        pending_complaints: 0,
        created_at: now,
        updated_at: now,
      });
    }
  }

  if (!payloads.length) return;

  await collection.insertMany(payloads);
}

async function seedDemoComplaints(db) {
  const complaintCollection = db.collection("complaints");
  const existing = await complaintCollection.countDocuments();
  if (existing > 0) return;

  const departments = await db.collection("departments").find().toArray();
  const officers = await db.collection("officers").find().toArray();
  if (!departments.length || !officers.length) return;

  const departmentMap = new Map(departments.map(item => [item.name, item._id.toString()]));
  const officerMap = new Map();
  for (const officer of officers) {
    const departmentId = officer.department_id ? String(officer.department_id) : null;
    if (!departmentId) continue;
    if (!officerMap.has(departmentId)) {
      officerMap.set(departmentId, []);
    }
    officerMap.get(departmentId).push(officer);
  }

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
      status: "assigned",
      created_at: daysAgo(4),
      updated_at: daysAgo(4),
    },
    {
      category: "Education",
      sub_category: "Teacher Vacancy",
      description: "School has two vacant teacher posts",
      location_text: "Block A",
      department_name: "Block Education Office",
      status: "assigned",
      created_at: daysAgo(3),
      updated_at: daysAgo(3),
    },
    {
      category: "Law & Order",
      sub_category: "Noise Complaint",
      description: "Repeated loud gatherings late at night",
      location_text: "Market Road",
      department_name: "Police Station / Dist. SP Office",
      status: "assigned",
      created_at: daysAgo(2),
      updated_at: daysAgo(2),
    },
  ];

  const payloads = [];
  for (const row of demoRows) {
    const departmentId = departmentMap.get(row.department_name);
    const departmentOfficers = officerMap.get(departmentId) || [];
    const assignedOfficer = departmentOfficers[0] || null;
    payloads.push({
      complaint_number: null,
      citizen_profile_id: null,
      voter_id: null,
      submitted_by: null,
      category: row.category,
      sub_category: row.sub_category,
      description: row.description,
      location_text: row.location_text,
      attachment_url: null,
      assigned_department_id: departmentId,
      assigned_officer_id: assignedOfficer ? assignedOfficer.profile_id : null,
      priority: "normal",
      status: row.status,
      resolution_note: null,
      expected_resolution_at: daysAhead(5),
      resolved_at: null,
      reopened_at: null,
      closed_at: null,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
  }

  if (payloads.length) {
    await complaintCollection.insertMany(payloads);
  }

  const allOfficers = await db.collection("officers").find().toArray();
  for (const officer of allOfficers) {
    const profileId = officer.profile_id ? String(officer.profile_id) : null;
    const departmentId = officer.department_id ? String(officer.department_id) : null;
    const filter =
      profileId && departmentId
        ? { $or: [{ assigned_officer_id: profileId }, { assigned_department_id: departmentId }] }
        : profileId
          ? { assigned_officer_id: profileId }
          : { assigned_department_id: departmentId };
    const assigned = await complaintCollection.find(filter).toArray();
    const pending = assigned.filter(item => item.status !== "resolved" && item.status !== "closed").length;
    await db.collection("officers").updateOne(
      { _id: officer._id },
      {
        $set: {
          total_complaints_assigned: assigned.length,
          pending_complaints: pending,
          updated_at: new Date().toISOString(),
        },
      },
    );
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
    { role: "officer", email: "officer@janseva.local", name: "Demo Officer" },
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

module.exports = { seedDepartments, seedOfficers, seedDemoComplaints, seedAdmin, seedDemoStaff };
