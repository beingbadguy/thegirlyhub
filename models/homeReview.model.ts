import mongoose from "mongoose";

const homeReviewSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 500 },
    productTitle: { type: String, trim: true, maxlength: 160 },
    productImage: { type: String, trim: true },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const HomeReview =
  mongoose.models.HomeReview || mongoose.model("HomeReview", homeReviewSchema);

export default HomeReview;
