import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: "" },
    subtitle: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    image: { type: String, required: true },
    link: { type: String, required: true, trim: true },
    buttonText: { type: String, trim: true },
    displayOrder: { type: Number, required: true, index: true },
    isActive: { type: Boolean, required: true, index: true },
  },
  { timestamps: true },
);

const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
export default Banner;
