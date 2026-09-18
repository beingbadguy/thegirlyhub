import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    username: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2_000 },
    photos: { type: [String], default: [] },
  },
  { timestamps: true },
);

const variantSchema = new mongoose.Schema(
  {
    attributes: {
      color: { type: String, trim: true },
      size: { type: String, trim: true },
    },
    price: { type: Number, min: 0, default: 0 },
    discountedPrice: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    images: { type: [String], default: [] },
    weight: { type: Number, min: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    slug: { type: String, trim: true, lowercase: true },
    shortDescription: { type: String, trim: true, maxlength: 320 },
    longDescription: { type: String, trim: true },
    category: {
      type: String,
      trim: true,
      lowercase: true,
      default: "jewellery",
    },
    subCategory: { type: String, trim: true, lowercase: true },
    brand: { type: String, trim: true, default: "GirlyHub" },
    tags: { type: [String], default: [] },

    material: {
      type: String,
      trim: true,
      default: "",
    },
    plating: {
      type: String,
      lowercase: true,
    },
    stoneType: {
      type: String,
      lowercase: true,
      default: "none",
    },
    color: {
      type: String,
    },
    occasion: {
      type: String,
    },
    style: {
      type: String,
    },
    gender: {
      type: String,
      default: "women",
    },
    setType: {
      type: String,
      default: "single",
    },

    variants: { type: [variantSchema], default: [] },
    costPrice: { type: Number, min: 0, default: 0 },
    sellingPrice: { type: Number, min: 0, default: 0 },
    discountPercentage: { type: Number, min: 0, default: 0 },
    currency: { type: String, default: "INR" },
    mainImage: { type: String, trim: true },
    images: { type: [String], default: [] },
    video: { type: String, trim: true },

    totalStock: { type: Number, min: 0, default: 0 },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    trackInventory: { type: Boolean, default: true },
    weight: { type: Number, min: 0, default: 0 },
    dimensions: {
      length: { type: Number, min: 0, default: 0 },
      breadth: { type: Number, min: 0, default: 0 },
      height: { type: Number, min: 0, default: 0 },
    },

    metaTitle: { type: String, trim: true, maxlength: 60 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    averageRating: { type: Number, min: 0, max: 5, default: 0 },
    totalReviews: { type: Number, min: 0, default: 0 },
    status: {
      type: String,
      enum: ["draft", "active", "featured", "new_arrival", "out_of_stock", "archived"],
      default: "draft",
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    reviews: { type: [reviewSchema], default: [] },

    // Legacy fields retained so cart, checkout, and existing screens continue to work seamlessly.
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    image: { type: String, trim: true },
    price: { type: Number, min: 0, default: 0 },
    discountedPrice: { type: Number, min: 0, default: 0 },
    discountPrice: { type: Number, min: 0, default: 0 },
    countInStock: { type: Number, min: 0, default: 0 },
    stock: { type: Number, min: 0, default: 0 },
    sold: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    ratings: { type: Number, min: 0, max: 5, default: 0 },
    numReviews: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    length: { type: Number, min: 0 },
    breadth: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    info: { type: String },
  },
  { timestamps: true, minimize: true },
);

productSchema.pre("validate", function syncProductFields(next) {
  this.name = this.name || this.title || "Product";
  this.title = this.title || this.name;
  this.category = this.category || "jewellery";
  if (Array.isArray(this.images)) {
    this.images = Array.from(new Set(this.images.filter(Boolean)));
  } else {
    this.images = [];
  }
  this.mainImage = this.images[0] || this.mainImage || this.image || "";
  this.image = this.mainImage;
  if (!this.images.length && this.mainImage) {
    this.images = [this.mainImage];
  }

  this.shortDescription = this.shortDescription || this.description || "";
  this.description = this.description || this.shortDescription || "";
  this.longDescription = this.longDescription || this.description || "";

  this.sellingPrice =
    this.sellingPrice || this.discountPrice || this.discountedPrice || this.price || 0;
  this.price = this.price || this.sellingPrice || 0;
  this.discountPrice = this.sellingPrice;
  this.discountedPrice = this.sellingPrice;
  this.discountPercentage =
    this.price && this.sellingPrice && this.price > this.sellingPrice
      ? Math.max(0, ((this.price - this.sellingPrice) / this.price) * 100)
      : 0;

  this.totalStock =
    this.totalStock !== undefined && this.totalStock !== null
      ? Number(this.totalStock)
      : Number(this.stock ?? this.countInStock ?? 0);
  this.stock = this.totalStock;
  this.countInStock = this.totalStock;

  this.averageRating = this.averageRating ?? this.ratings ?? this.rating ?? 0;
  this.ratings = this.averageRating;
  this.rating = this.averageRating;
  this.totalReviews = this.totalReviews ?? this.numReviews ?? 0;
  this.numReviews = this.totalReviews;

  // Legacy records have no status. Treat an active legacy record as publishable.
  if (this.status === "draft" && this.isActive && !this.isModified("status")) {
    this.status = "active";
  }

  if (
    this.status === "active" &&
    this.trackInventory &&
    this.totalStock === 0
  ) {
    this.status = "out_of_stock";
  }
  this.isActive = this.status === "active" || this.status === "out_of_stock";

  next();
});

productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ category: 1, status: 1, createdAt: -1 });
productSchema.index({ isFeatured: 1, isNewArrival: 1, status: 1 });
productSchema.index({ averageRating: -1, status: 1 });
productSchema.index({ discountedPrice: 1, status: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({
  name: "text",
  shortDescription: "text",
});

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);
export default Product;
export { productSchema, variantSchema };

