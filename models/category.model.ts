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
  },
  { timestamps: true },
);

categorySchema.index({ isActive: 1, isDeleted: 1 });
categorySchema.index({ name: 1 }, { unique: true });
categorySchema.index({ createdAt: -1 });

const Category =
  mongoose.models.Category || mongoose.model("Category", categorySchema);
export default Category;
