import mongoose, { Schema, Document } from "mongoose";

export interface IReel extends Document {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  aspectRatio: string;
  productId?: mongoose.Types.ObjectId;
  productTitle?: string;
  productPrice?: number;
  productImage?: string;
  productSlug?: string;
  productUrl?: string;
  displayOrder: number;
  isActive: boolean;
  viewsCount: number;
  likesCount: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const reelSchema = new Schema<IReel>(
  {
    title: {
      type: String,
      required: [true, "Reel title / caption is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
      trim: true,
    },
    thumbnailUrl: {
      type: String,
      trim: true,
      default: "",
    },
    duration: {
      type: Number,
      default: 0,
    },
    aspectRatio: {
      type: String,
      default: "9:16",
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productTitle: {
      type: String,
      default: "",
    },
    productPrice: {
      type: Number,
      default: 0,
    },
    productImage: {
      type: String,
      default: "",
    },
    productSlug: {
      type: String,
      default: "",
    },
    productUrl: {
      type: String,
      default: "",
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

reelSchema.index({ isActive: 1, isDeleted: 1, displayOrder: 1, createdAt: -1 });

const Reel =
  mongoose.models.Reel || mongoose.model<IReel>("Reel", reelSchema);

export default Reel;
