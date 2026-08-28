import mongoose from "mongoose";

const reviewEmbedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
    },
    photos: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true, sparse: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // Legacy main image
    images: { type: [String], default: [] }, // New array of images
    category: { type: String, required: true }, // jewellery, earrings, scrunchies, shoes, flats, dresses, suits
    price: { type: Number, required: true },
    discountedPrice: { type: Number, required: true }, // Legacy
    discountPrice: { type: Number, required: true }, // New
    discountPercentage: { type: Number, required: true },
    countInStock: { type: Number, required: true }, // Legacy
    stock: { type: Number, required: true }, // New
    sold: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }, // Legacy ratings
    ratings: { type: Number, default: 0 }, // New ratings
    numReviews: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    variants: {
      sizes: { type: [String], default: [] },
      colors: { type: [String], default: [] },
    },
    weight: { type: Number },
    length: { type: Number },
    breadth: { type: Number },
    height: { type: Number },
    reviews: [reviewEmbedSchema],
    info: { type: String },
  },
  { timestamps: true }
);

// Mongoose Pre-validate hook to sync legacy and new fields
productSchema.pre("validate", function (next) {
  // 1. Sync stock & countInStock
  if (this.stock !== undefined) {
    this.countInStock = this.stock;
  } else if (this.countInStock !== undefined) {
    this.stock = this.countInStock;
  } else {
    this.stock = 0;
    this.countInStock = 0;
  }

  // 2. Sync discountPrice & discountedPrice
  if (this.discountPrice !== undefined) {
    this.discountedPrice = this.discountPrice;
  } else if (this.discountedPrice !== undefined) {
    this.discountPrice = this.discountedPrice;
  } else {
    this.discountPrice = this.price || 0;
    this.discountedPrice = this.price || 0;
  }

  // 3. Sync rating & ratings
  if (this.ratings !== undefined) {
    this.rating = this.ratings;
  } else if (this.rating !== undefined) {
    this.ratings = this.rating;
  }

  // 4. Sync image & images
  if (this.images && this.images.length > 0) {
    this.image = this.images[0];
  } else if (this.image) {
    this.images = [this.image];
  } else {
    this.image = "";
    this.images = [];
  }

  // 5. Calculate discountPercentage
  if (this.price && this.discountPrice !== undefined) {
    const diff = this.price - this.discountPrice;
    this.discountPercentage = this.price > 0 ? (diff / this.price) * 100 : 0;
  } else {
    this.discountPercentage = 0;
  }

  next();
});

// Indexes for high performance / scalability
productSchema.index({ title: "text", description: "text" });
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ ratings: -1 });

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
