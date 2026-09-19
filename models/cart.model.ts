import mongoose from "mongoose";
import "@/models/product.model";

const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },
    size: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);
(cartItemSchema as any).set("strictPopulate", false);

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  products: [cartItemSchema],
  createdAt: { type: Date, default: Date.now },
});
(cartSchema as any).set("strictPopulate", false);

cartSchema.index({ userId: 1 }, { unique: true });

if (process.env.NODE_ENV !== "production" && mongoose.models.Cart) {
  delete (mongoose.models as any).Cart;
}

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);
export default Cart;
