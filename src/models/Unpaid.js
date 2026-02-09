import mongoose from "mongoose";

const unpaidSchema = new mongoose.Schema({
  week: { type: String },
  name: { type: String },
  grade: { type: String },
  total: { type: String },
});

const Unpaid = mongoose.models.Unpaid || mongoose.model("Unpaid", unpaidSchema);

export default Unpaid;
