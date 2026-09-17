import mongoose, { Document, Schema } from "mongoose";

export interface IPaymentWebhookLog extends Document {
  eventId: string;
  eventType: string;
  entityId?: string | null;
  paymentId?: string | null;
  refundId?: string | null;
  orderId?: string | null;
  status: "processed" | "failed" | "ignored";
  signatureVerified: boolean;
  payload?: any;
  error?: string | null;
  processedAt: Date;
  createdAt: Date;
}

const paymentWebhookLogSchema = new Schema<IPaymentWebhookLog>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    entityId: {
      type: String,
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
    orderId: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["processed", "failed", "ignored"],
      default: "processed",
      index: true,
    },
    signatureVerified: {
      type: Boolean,
      required: true,
      default: false,
    },
    payload: {
      type: Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

paymentWebhookLogSchema.index({ createdAt: -1 });

const PaymentWebhookLog =
  mongoose.models.PaymentWebhookLog ||
  mongoose.model<IPaymentWebhookLog>("PaymentWebhookLog", paymentWebhookLogSchema);

export default PaymentWebhookLog;
