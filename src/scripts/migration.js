import mongoose from "mongoose";

const MONGODB_URI =
  "mongodb+srv://nikola:nikolaminchev@foodmanagement.ylemseu.mongodb.net/?appName=foodmanagement";

await mongoose.connect(MONGODB_URI);

const result = await mongoose.connection
  .collection("users")
  .updateMany(
    { ordersToBeGot: { $exists: false } },
    { $set: { ordersToBeGot: [] } },
  );

console.log("Done:", result);
await mongoose.disconnect();
