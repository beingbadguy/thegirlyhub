import mongoose from "mongoose";

const pendingPaymentSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true },
  amountInPaise: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isGuest: { type: Boolean, default: true },
  orderPayload: { type: mongoose.Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ["pending", "paid", "failed"],
    default: "pending",
  },
  paymentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const PendingPayment =
  mongoose.models.PendingPayment ||
  mongoose.model("PendingPayment", pendingPaymentSchema);

export default PendingPayment;
