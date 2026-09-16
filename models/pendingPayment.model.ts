import mongoose from "mongoose";

const pendingPaymentSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  amountInPaise: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isGuest: { type: Boolean, default: true },
  orderPayload: { type: mongoose.Schema.Types.Mixed, required: true },
  snapshot: { type: mongoose.Schema.Types.Mixed, default: null },
  status: {
    type: String,
    enum: ["pending", "processing", "paid", "failed", "refunded"],
    default: "pending",
  },
  paymentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

pendingPaymentSchema.index({ paymentId: 1 }, { sparse: true });
pendingPaymentSchema.index({ status: 1, createdAt: -1 });

const PendingPayment =
  mongoose.models.PendingPayment ||
  mongoose.model("PendingPayment", pendingPaymentSchema);

export default PendingPayment;

