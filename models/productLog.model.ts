import mongoose from "mongoose";

export interface IProductLog {
  action: "create" | "update" | "delete";
  productId?: mongoose.Types.ObjectId | string | null;
  productTitle?: string | null;
  productSlug?: string | null;
  performedBy?: mongoose.Types.ObjectId | string | null;
  adminEmail?: string | null;
  changes?: any;
  details?: string | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["create", "update", "delete"],
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: false,
      index: true,
    },
    productTitle: {
      type: String,
      default: null,
      trim: true,
    },
    productSlug: {
      type: String,
      default: null,
      trim: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    adminEmail: {
      type: String,
      default: null,
      trim: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    details: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

productLogSchema.index({ productId: 1, timestamp: -1 });
productLogSchema.index({ action: 1, timestamp: -1 });

const ProductLog =
  mongoose.models.ProductLog ||
  mongoose.model<IProductLog>("ProductLog", productLogSchema);

export default ProductLog;
