import mongoose from "mongoose";

const newsletterSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

newsletterSchema.index({ email: 1 }, { unique: true });
newsletterSchema.index({ createdAt: -1 });

const Newsletter =
  mongoose.models.Newsletter || mongoose.model("Newsletter", newsletterSchema);
export default Newsletter;
