import Razorpay from "razorpay";
import crypto from "crypto";
import { logPaymentEvent } from "@/lib/logger";

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (razorpayInstance) return razorpayInstance;

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    const errorMsg = "Razorpay API credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing.";
    logPaymentEvent("error", errorMsg, { event: "RAZORPAY_CONFIG_ERROR" });
    throw new Error(errorMsg);
  }

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayInstance;
}

/**
 * Verify webhook HMAC SHA256 signature using timing-safe comparison
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    logPaymentEvent("error", "RAZORPAY_WEBHOOK_SECRET is not configured in environment.", {
      event: "WEBHOOK_VERIFICATION_FAILED",
    });
    return false;
  }

  if (!signature || !rawBody) {
    logPaymentEvent("warn", "Webhook verification missing signature or payload.", {
      event: "WEBHOOK_VERIFICATION_FAILED",
    });
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const receivedBuf = Buffer.from(signature, "utf8");

    if (expectedBuf.length !== receivedBuf.length) {
      logPaymentEvent("warn", "Webhook signature length mismatch.", {
        event: "WEBHOOK_SIGNATURE_MISMATCH",
      });
      return false;
    }

    const isValid = crypto.timingSafeEqual(expectedBuf, receivedBuf);
    if (!isValid) {
      logPaymentEvent("warn", "Webhook HMAC signature comparison failed.", {
        event: "WEBHOOK_SIGNATURE_INVALID",
      });
    }

    return isValid;
  } catch (error) {
    logPaymentEvent("error", "Error during webhook signature verification.", {
      event: "WEBHOOK_VERIFY_ERROR",
      error,
    });
    return false;
  }
}

/**
 * Fetch and validate payment details from Razorpay API
 */
export async function fetchPaymentDetails(paymentId: string) {
  const rzp = getRazorpayClient();
  try {
    const payment = await rzp.payments.fetch(paymentId);
    logPaymentEvent("info", `Fetched payment details for ${paymentId}`, {
      event: "PAYMENT_FETCH_SUCCESS",
      paymentId,
      status: payment.status,
      amount: payment.amount ? Number(payment.amount) / 100 : undefined,
    });
    return { success: true, payment };
  } catch (error: any) {
    logPaymentEvent("error", `Failed to fetch payment details for ${paymentId}`, {
      event: "PAYMENT_FETCH_FAILED",
      paymentId,
      error: error?.error?.description || error?.message || error,
    });
    return {
      success: false,
      error: error?.error?.description || error?.message || "Failed to fetch payment details",
      raw: error,
    };
  }
}

export interface RefundOptions {
  paymentId: string;
  orderId?: string;
  amountInRupees?: number;
  amountInPaise?: number;
  speed?: "normal" | "optimum";
  notes?: Record<string, string>;
  receipt?: string;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  refund?: any;
  refundId?: string;
  amountInRupees?: number;
  amountInPaise?: number;
  status?: "pending" | "completed" | "failed";
  error?: string;
  raw?: any;
}

/**
 * Trigger refund via Razorpay Refund API
 * Supports both full refund (default) and partial refund (when amount specified)
 */
export async function triggerRazorpayRefund(options: RefundOptions): Promise<RefundResult> {
  const {
    paymentId,
    orderId,
    amountInRupees,
    amountInPaise,
    speed = "optimum",
    notes = {},
    receipt,
    reason,
  } = options;

  if (!paymentId) {
    return { success: false, error: "Payment ID is required for refund" };
  }

  const rzp = getRazorpayClient();

  // Determine amount in paise
  let calculatedPaise: number | undefined = undefined;
  if (typeof amountInPaise === "number" && amountInPaise > 0) {
    calculatedPaise = Math.round(amountInPaise);
  } else if (typeof amountInRupees === "number" && amountInRupees > 0) {
    calculatedPaise = Math.round(amountInRupees * 100);
  }

  const refundParams: any = {
    speed,
    notes: {
      ...notes,
      orderId: orderId || notes.orderId || "",
      reason: reason || notes.reason || "Order cancellation",
      source: "GirlyHub backend",
    },
  };

  if (calculatedPaise !== undefined) {
    refundParams.amount = calculatedPaise;
  }

  if (receipt) {
    refundParams.receipt = receipt;
  }

  logPaymentEvent("info", `Initiating Razorpay refund for payment ${paymentId}`, {
    event: "REFUND_INITIATE",
    orderId,
    paymentId,
    amount: calculatedPaise ? calculatedPaise / 100 : "FULL_REFUND",
    reason,
  });

  try {
    const refund = await rzp.payments.refund(paymentId, refundParams);

    const actualPaise = Number(refund.amount || calculatedPaise || 0);
    const actualRupees = actualPaise / 100;
    const status: "pending" | "completed" | "failed" =
      refund.status === "processed" ? "completed" : "pending";

    logPaymentEvent("info", `Razorpay refund created successfully: ${refund.id}`, {
      event: "REFUND_SUCCESS",
      orderId,
      paymentId,
      refundId: refund.id,
      amount: actualRupees,
      status: refund.status,
    });

    return {
      success: true,
      refund,
      refundId: refund.id,
      amountInRupees: actualRupees,
      amountInPaise: actualPaise,
      status,
      raw: refund,
    };
  } catch (error: any) {
    const errorDescription =
      error?.error?.description ||
      error?.description ||
      error?.message ||
      "Razorpay refund API call failed";

    logPaymentEvent("error", `Razorpay refund failed for payment ${paymentId}: ${errorDescription}`, {
      event: "REFUND_FAILED",
      orderId,
      paymentId,
      amount: calculatedPaise ? calculatedPaise / 100 : undefined,
      error: errorDescription,
    });

    return {
      success: false,
      error: errorDescription,
      status: "failed",
      raw: error,
    };
  }
}
