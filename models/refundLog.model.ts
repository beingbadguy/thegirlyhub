import mongoose, { Document, Schema } from "mongoose";

export interface IRefundLog extends Document {
  orderId: mongoose.Types.ObjectId;
  paymentId: string;
  razorpayRefundId: string;
  amount: number; // in Rupees
  amountInPaise: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  reason?: string | null;
  speed: "normal" | "optimum";
  initiatedBy: "customer" | "admin" | "system";
  userId?: mongoose.Types.ObjectId | null;
  errorDescription?: string | null;
  rawResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

const refundLogSchema = new Schema<IRefundLog>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    paymentId: {
      type: String,
      required: true,
      index: true,
    },
    razorpayRefundId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountInPaise: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    reason: {
      type: String,
      default: null,
    },
    speed: {
      type: String,
      enum: ["normal", "optimum"],
      default: "optimum",
    },
    initiatedBy: {
      type: String,
      enum: ["customer", "admin", "system"],
      default: "customer",
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    errorDescription: {
      type: String,
      default: null,
    },
    rawResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

refundLogSchema.index({ orderId: 1, createdAt: -1 });

const RefundLog =
  mongoose.models.RefundLog ||
  mongoose.model<IRefundLog>("RefundLog", refundLogSchema);

export default RefundLog;
