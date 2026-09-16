import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
    ip: String,
    userAgent: String,
    visitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

visitorSchema.index({ visitedAt: -1 });
visitorSchema.index({ ip: 1, visitedAt: -1 });

// Prevent model overwrite during hot reload
const Visitor =
  mongoose.models.Visitor || mongoose.model("Visitor", visitorSchema);

export default Visitor;
