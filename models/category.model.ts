import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    categoryImage: {
      type: String,
      required: true,
    },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, isDeleted: 1 });
categorySchema.index({ isDeleted: 1, deletedAt: -1 });
categorySchema.index({ name: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
categorySchema.index({ createdAt: -1 });

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
export default Category;
