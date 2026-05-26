async function nextComplaintNumber(db) {
  const counter = await db.collection("counters").findOneAndUpdate(
    { _id: "complaint_number" },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  const seq = counter.value?.seq ?? 1;
  const year = new Date().getFullYear();
  const padded = String(seq).padStart(5, "0");
  return `CMP-${year}-${padded}`;
}

module.exports = { nextComplaintNumber };
