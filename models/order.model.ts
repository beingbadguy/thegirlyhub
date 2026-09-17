import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "reviewing",
        "preparing",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
      ],
    },
    changedAt: { type: Date, default: Date.now },
    note: { type: String, default: null },
  },
  { _id: false }
);

const refundHistorySchema = new mongoose.Schema(
  {
    refundId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    razorpayPaymentId: { type: String, default: null },
    speed: { type: String, enum: ["normal", "optimum"], default: "optimum" },
    reason: { type: String, default: null },
    failureReason: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
  isGuest: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ["created", "paid", "unpaid", "failed"],
    default: "created",
  },
  refundStatus: {
    type: String,
    enum: ["none", "pending", "completed", "failed"],
    default: "none",
  },
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, default: 1, min: 1 },
      title: String,
      price: Number,
      image: String,
      size: String,
    },
  ],
  totalAmount: { type: Number, required: true, min: 0 },
  /** Recorded at checkout — products price before any charges/discounts */
  subtotal: { type: Number, default: 0 },
  /** Recorded at checkout — delivery/shipping fee applied */
  shippingCharge: { type: Number, default: 0 },
  /** Recorded at checkout — first-order 15% discount amount */
  firstOrderDiscount: { type: Number, default: 0 },
  /** Recorded at checkout — coupon discount amount (0 if no coupon) */
  couponDiscount: { type: Number, default: 0 },
  paymentMethod: {
    type: String,
    required: true,
    default: "cod",
    enum: ["cod", "online"],
  },
  status: {
    type: String,
    required: true,
    default: "pending",
    enum: [
      "pending",
      "confirmed",
      "processing",
      "reviewing",
      "preparing",
      "shipped",
      "delivered",
      "completed",
      "cancelled",
    ],
  },
  /** Tracks every status change with a timestamp */
  statusHistory: {
    type: [statusHistorySchema],
    default: [],
  },
  /** Refund tracking fields */
  refundId: { type: String, default: null },
  refundAmount: { type: Number, default: 0, min: 0 },
  refundReason: { type: String, default: null },
  refundHistory: {
    type: [refundHistorySchema],
    default: [],
  },
  cancellationReason: { type: String, default: null },
  cancelledAt: { type: Date, default: null },
  /** Air Waybill number — required when status is "shipped" */
  awbNumber: { type: String, default: null },
  /** Carrier tracking link — set when status is "shipped" */
  trackingLink: { type: String, default: null },
  deliveryType: {
    type: String,
    required: true,
    default: "normal",
    enum: ["normal", "fast"],
  },
  recipientName: { type: String, required: true },
  email: { type: String, default: null },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  landmark: { type: String, default: null },
  orderNotes: { type: String, default: null, maxlength: 500 },
  zip: { type: Number, required: true },
  phone: { type: Number, required: true },
  couponCode: { type: String, default: null },
  paymentId: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

orderSchema.index({ paymentId: 1 }, { unique: true, sparse: true });
orderSchema.index({ refundId: 1 }, { sparse: true });
orderSchema.index({ refundStatus: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ email: 1, createdAt: -1 });
orderSchema.index({ phone: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;


