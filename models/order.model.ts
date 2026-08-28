import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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
