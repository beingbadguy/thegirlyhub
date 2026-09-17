import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    maxDiscount: { type: Number, default: null },
    minOrderAmount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    validTill: { type: Date, default: null },
    usersAvailed: { type: [String], default: [] },
    type: { type: String, enum: ["percentage", "flat"], default: "flat" },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ createdAt: -1 });

if (mongoose.models.Coupon) {
  delete mongoose.models.Coupon;
}
const Coupon = mongoose.model("Coupon", couponSchema);
export default Coupon;
