import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: [
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

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null },
  isGuest: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "paid", "failed"],
    default: "unpaid",
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
    default: "processing",
    enum: [
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

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);
export default Order;
