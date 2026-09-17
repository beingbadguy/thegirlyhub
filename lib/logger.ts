/**
 * Structured Audit & Event Logger for Payments, Refunds, and Webhooks
 */

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogPayload {
  event: string;
  eventType?: string;
  orderId?: string | null;
  paymentId?: string | null;
  refundId?: string | null;
  productId?: string | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
  amount?: number | string | null;
  quantity?: number | null;
  status?: string | null;
  reason?: string | null;
  userId?: string | null;
  ip?: string | null;
  requestedBy?: string | null;
  metadata?: Record<string, any>;
  error?: any;
  [key: string]: any;
}

export function logPaymentEvent(level: LogLevel, message: string, payload: LogPayload) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    service: "PaymentRefundEngine",
    level: level.toUpperCase(),
    message,
    ...payload,
    error: payload.error ? (payload.error instanceof Error ? payload.error.message : payload.error) : undefined,
  };

  const formatted = `[${logEntry.timestamp}] [${logEntry.level}] [${logEntry.event}] ${message}`;

  switch (level) {
    case "error":
      console.error(formatted, JSON.stringify(logEntry, null, 2));
      break;
    case "warn":
      console.warn(formatted, JSON.stringify(logEntry));
      break;
    case "debug":
      if (process.env.NODE_ENV === "development") {
        console.debug(formatted, logEntry);
      }
      break;
    default:
      console.log(formatted, JSON.stringify(logEntry));
  }
}
