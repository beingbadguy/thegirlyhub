import mongoose from "mongoose";

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

faqSchema.index({ isActive: 1, createdAt: 1 });

const Faq = mongoose.models.Faq || mongoose.model("Faq", faqSchema);
export default Faq;
