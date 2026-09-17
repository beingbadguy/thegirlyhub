import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  orderId?: mongoose.Types.ObjectId | null;
  paymentId: string;
  razorpayOrderId?: string | null;
  amount: number; // In Rupees
  amountInPaise: number;
  currency: string;
  status: "created" | "authorized" | "captured" | "refunded" | "failed";
  method?: string | null;
  fee?: number; // Gateway fee in INR
  tax?: number; // GST on gateway fee in INR
  email?: string | null;
  contact?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
  capturedAt?: Date | null;
  rawPayload?: any;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
    },
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      default: null,
      index: true,
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
      enum: ["created", "authorized", "captured", "refunded", "failed"],
      default: "captured",
      index: true,
    },
    method: {
      type: String,
      default: null,
    },
    fee: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    email: {
      type: String,
      default: null,
    },
    contact: {
      type: String,
      default: null,
    },
    errorCode: {
      type: String,
      default: null,
    },
    errorDescription: {
      type: String,
      default: null,
    },
    capturedAt: {
      type: Date,
      default: null,
    },
    rawPayload: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });

const Payment =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", paymentSchema);

export default Payment;
