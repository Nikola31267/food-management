import mongoose from "mongoose";
import User from "../models/User.js";

const MONGODB_URI = "";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI in .env");
  process.exit(1);
}

const USERS = [
  {
    email: "et.mariela.g@eduiteh.eu",
    fullName: "Мариела Гроздева",
    grade: "12Г",
  },
];

const MODE = "insert-only";

function normalizeUser(u) {
  const email = String(u.email || "")
    .trim()
    .toLowerCase();
  const fullName = u.fullName ? String(u.fullName).trim() : undefined;
  const grade = u.grade ? String(u.grade).trim() : undefined;

  if (!email) throw new Error("User is missing email");
  return { email, fullName, grade };
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const map = new Map();
  for (const u of USERS) {
    const nu = normalizeUser(u);
    map.set(nu.email, nu);
  }
  const users = [...map.values()];

  if (MODE === "insert-only") {
    const emails = users.map((u) => u.email);
    const existing = await User.find(
      { email: { $in: emails } },
      { email: 1 },
    ).lean();
    const existingSet = new Set(existing.map((d) => d.email));

    const toInsert = users.filter((u) => !existingSet.has(u.email));

    if (toInsert.length === 0) {
      console.log("Nothing to insert. All users already exist.");
      return;
    }

    const inserted = await User.insertMany(
      toInsert.map((u) => ({
        email: u.email,
        fullName: u.fullName,
        grade: u.grade,
        role: "student",
        orders: [],
        archivedOrders: [],
      })),
      { ordered: false },
    );

    console.log(`✅ Inserted ${inserted.length} user(s).`);
    console.log(
      `↪️ Skipped ${users.length - toInsert.length} existing user(s).`,
    );
  } else if (MODE === "upsert") {
    // Bulk upsert (insert or update)
    const ops = users.map((u) => ({
      updateOne: {
        filter: { email: u.email },
        update: {
          $set: {
            email: u.email,
            fullName: u.fullName,
            grade: u.grade,
            role: "student",
          },
          $setOnInsert: {
            orders: [],
            archivedOrders: [],
          },
        },
        upsert: true,
      },
    }));

    const result = await User.bulkWrite(ops, { ordered: false });
    console.log("✅ Upsert complete.");
    console.log("Inserted:", result.upsertedCount);
    console.log("Modified:", result.modifiedCount);
    console.log("Matched:", result.matchedCount);
  } else {
    throw new Error(`Unknown MODE: ${MODE}`);
  }
}

run()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
    console.log("🔌 Disconnected");
  });
