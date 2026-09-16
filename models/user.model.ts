import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false, default: null },
  authProvider: {
    type: String,
    enum: ["local", "google", "facebook", "apple"],
    default: "local",
  },
  googleId: { type: String, default: null },
  facebookId: { type: String, default: null },
  appleId: { type: String, default: null },
  image: {
    type: String,
    // required: true,
    default: null,
  },
  address: {
    type: String,
    default: null,
  },
  city: {
    type: String,
    default: null,
  },
  state: {
    type: String,
    default: null,
  },
  landmark: {
    type: String,
    default: null,
  },
  zip: {
    type: Number,
    default: null,
  },
  phone: {
    type: Number,
    // required: true,
    default: null,
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "admin"],
    default: "user",
  },
  isVerified: {
    type: Boolean,
    default: false,
    required: true,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpiry: {
    type: Date,
    default: null,
  },
  forgetToken: {
    type: String,
    default: null,
  },
  forgetTokenExpiry: {
    type: Date,
    default: null,
  },
  resetRequestCount: { type: Number, default: 0 },
  lastResetRequest: { type: Date, default: null },
  wishlist: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wishlist",
    },
  ],
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
    },
  ],
  order: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  recentlyViewed: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  firstPurchase: {
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ verificationToken: 1 }, { sparse: true });
userSchema.index({ forgetToken: 1 }, { sparse: true });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
