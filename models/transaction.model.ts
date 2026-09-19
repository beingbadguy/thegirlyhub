import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  transactionId: string;
  orderId?: mongoose.Types.ObjectId | null;
  paymentId?: string | null;
  refundId?: string | null;
  userId?: mongoose.Types.ObjectId | null;
  type: "credit" | "debit";
  category: "payment" | "refund" | "gateway_fee" | "adjustment";
  amount: number; // In Rupees (always positive number)
  currency: string;
  status: "completed" | "pending" | "failed";
  description: string;
  idempotencyKey: string;
  balanceAfter?: number | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    paymentId: {
      type: String,
      default: null,
      index: true,
    },
    refundId: {
      type: String,
      default: null,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ["payment", "refund", "gateway_fee", "adjustment"],
      required: true,
      index: true,
    },
    amount: {
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
      enum: ["completed", "pending", "failed"],
      default: "completed",
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
    },
    balanceAfter: {
      type: Number,
      default: null,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ category: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1, createdAt: -1 });

const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", transactionSchema);

export default Transaction;
