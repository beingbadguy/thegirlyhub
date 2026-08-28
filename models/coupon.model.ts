import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    validTill: { type: Date, default: null },
    usersAvailed: { type: [String], default: [] },
    type: { type: String, enum: ["percentage", "flat"], default: "flat" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

if (mongoose.models.Coupon) {
  delete mongoose.models.Coupon;
}
const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
