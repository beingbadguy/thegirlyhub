import Payment from "@/models/payment.model";
import Transaction from "@/models/transaction.model";
import { logPaymentEvent } from "@/lib/logger";
import mongoose from "mongoose";

export interface RecordPaymentParams {
  orderId?: mongoose.Types.ObjectId | string | null;
  paymentId: string;
  razorpayOrderId?: string | null;
  amount: number; // in INR
  fee?: number; // Gateway fee in INR
  tax?: number; // GST on fee in INR
  method?: string | null;
  email?: string | null;
  contact?: string | null;
  userId?: mongoose.Types.ObjectId | string | null;
  rawPayload?: any;
}

export interface RecordRefundParams {
  orderId?: mongoose.Types.ObjectId | string | null;
  paymentId: string;
  refundId: string;
  amount: number; // in INR
  reason?: string | null;
  userId?: mongoose.Types.ObjectId | string | null;
  rawPayload?: any;
}

export interface RecordFeeParams {
  orderId?: mongoose.Types.ObjectId | string | null;
  paymentId: string;
  feeAmount: number; // in INR
  taxAmount?: number;
  description?: string;
  rawPayload?: any;
}

/**
 * Ledger Service - Automatic Transaction & Payment Recording with Strict Idempotency
 */

/**
 * Automatically record a successful payment and its gateway processing fee
 */
export async function recordPaymentSuccess(params: RecordPaymentParams) {
  const {
    orderId,
    paymentId,
    razorpayOrderId,
    amount,
    fee = 0,
    tax = 0,
    method,
    email,
    contact,
    userId,
    rawPayload,
  } = params;

  if (!paymentId || amount <= 0) {
    throw new Error("Payment ID and a valid positive amount are required.");
  }

  const amountInPaise = Math.round(amount * 100);
  const cleanOrderId =
    orderId && mongoose.Types.ObjectId.isValid(orderId.toString())
      ? new mongoose.Types.ObjectId(orderId.toString())
      : null;
  const cleanUserId =
    userId && mongoose.Types.ObjectId.isValid(userId.toString())
      ? new mongoose.Types.ObjectId(userId.toString())
      : null;

  // 1. Upsert Payment Document
  let paymentDoc = null;
  try {
    paymentDoc = await Payment.findOneAndUpdate(
      { paymentId },
      {
        $set: {
          orderId: cleanOrderId,
          razorpayOrderId: razorpayOrderId || null,
          amount,
          amountInPaise,
          currency: "INR",
          status: "captured",
          method: method || null,
          fee: Math.round(fee * 100) / 100,
          tax: Math.round(tax * 100) / 100,
          email: email || null,
          contact: contact || null,
          capturedAt: new Date(),
          rawPayload,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  } catch (payErr) {
    console.error("[LedgerService] Error recording Payment document:", payErr);
  }

  // 2. Record Credit Transaction (Incoming Payment)
  const creditTxId = `TXN-CR-${paymentId.replace(/^pay_/, "")}`;
  const creditIdempotencyKey = `credit_payment_${paymentId}`;

  try {
    await Transaction.findOneAndUpdate(
      { idempotencyKey: creditIdempotencyKey },
      {
        $setOnInsert: {
          transactionId: creditTxId,
          orderId: cleanOrderId,
          paymentId,
          userId: cleanUserId,
          type: "credit",
          category: "payment",
          amount: Math.round(amount * 100) / 100,
          currency: "INR",
          status: "completed",
          description: `Payment captured for order #${cleanOrderId || paymentId} via ${method || "Razorpay"}`,
          idempotencyKey: creditIdempotencyKey,
          metadata: {
            razorpayOrderId,
            method,
            email,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    logPaymentEvent("info", `Credit ledger entry created: ${creditTxId} (+₹${amount})`, {
      event: "LEDGER_CREDIT_RECORDED",
      orderId: cleanOrderId?.toString(),
      paymentId,
      amount,
    });
  } catch (txErr: any) {
    if (txErr?.code !== 11000) {
      console.error("[LedgerService] Error creating credit transaction:", txErr);
    }
  }

  // 3. Record Debit Transaction for Gateway Fee (if fee > 0)
  const totalFeeAndTax = Math.round((Number(fee) + Number(tax)) * 100) / 100;
  if (totalFeeAndTax > 0) {
    const feeTxId = `TXN-FEE-${paymentId.replace(/^pay_/, "")}`;
    const feeIdempotencyKey = `debit_fee_${paymentId}`;

    try {
      await Transaction.findOneAndUpdate(
        { idempotencyKey: feeIdempotencyKey },
        {
          $setOnInsert: {
            transactionId: feeTxId,
            orderId: cleanOrderId,
            paymentId,
            userId: cleanUserId,
            type: "debit",
            category: "gateway_fee",
            amount: totalFeeAndTax,
            currency: "INR",
            status: "completed",
            description: `Payment gateway fee (${fee > 0 ? `Fee: ₹${fee}` : ""}${tax > 0 ? `, GST: ₹${tax}` : ""}) for payment ${paymentId}`,
            idempotencyKey: feeIdempotencyKey,
            metadata: {
              baseFee: fee,
              tax,
              paymentId,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      logPaymentEvent("info", `Gateway fee debit entry created: ${feeTxId} (-₹${totalFeeAndTax})`, {
        event: "LEDGER_FEE_RECORDED",
        orderId: cleanOrderId?.toString(),
        paymentId,
        amount: totalFeeAndTax,
      });
    } catch (feeErr: any) {
      if (feeErr?.code !== 11000) {
        console.error("[LedgerService] Error creating gateway fee transaction:", feeErr);
      }
    }
  }

  return paymentDoc;
}

/**
 * Automatically record a refund transaction in the ledger
 */
export async function recordRefund(params: RecordRefundParams) {
  const {
    orderId,
    paymentId,
    refundId,
    amount,
    reason,
    userId,
    rawPayload,
  } = params;

  if (!refundId || amount <= 0) {
    throw new Error("Refund ID and a valid positive amount are required.");
  }

  const cleanOrderId =
    orderId && mongoose.Types.ObjectId.isValid(orderId.toString())
      ? new mongoose.Types.ObjectId(orderId.toString())
      : null;
  const cleanUserId =
    userId && mongoose.Types.ObjectId.isValid(userId.toString())
      ? new mongoose.Types.ObjectId(userId.toString())
      : null;

  const refundTxId = `TXN-REF-${refundId.replace(/^rfnd_/, "")}`;
  const refundIdempotencyKey = `debit_refund_${refundId}`;

  // 1. Record Debit Transaction (Refund)
  try {
    await Transaction.findOneAndUpdate(
      { idempotencyKey: refundIdempotencyKey },
      {
        $setOnInsert: {
          transactionId: refundTxId,
          orderId: cleanOrderId,
          paymentId,
          refundId,
          userId: cleanUserId,
          type: "debit",
          category: "refund",
          amount: Math.round(amount * 100) / 100,
          currency: "INR",
          status: "completed",
          description: `Refund processed for order #${cleanOrderId || paymentId}${reason ? ` (${reason})` : ""}`,
          idempotencyKey: refundIdempotencyKey,
          metadata: {
            reason,
            rawPayload,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    logPaymentEvent("info", `Refund debit ledger entry created: ${refundTxId} (-₹${amount})`, {
      event: "LEDGER_REFUND_RECORDED",
      orderId: cleanOrderId?.toString(),
      paymentId,
      refundId,
      amount,
    });
  } catch (txErr: any) {
    if (txErr?.code !== 11000) {
      console.error("[LedgerService] Error creating refund transaction:", txErr);
    }
  }

  // 2. Update Payment record status if exists
  if (paymentId) {
    try {
      await Payment.findOneAndUpdate(
        { paymentId },
        {
          $set: {
            status: "refunded",
            updatedAt: new Date(),
          },
        }
      );
    } catch (payErr) {
      console.error("[LedgerService] Error updating Payment status on refund:", payErr);
    }
  }
}

/**
 * Automatically record a gateway fee deduction
 */
export async function recordGatewayFee(params: RecordFeeParams) {
  const { orderId, paymentId, feeAmount, taxAmount = 0, description, rawPayload } = params;

  const totalFee = Math.round((feeAmount + taxAmount) * 100) / 100;
  if (totalFee <= 0 || !paymentId) return;

  const cleanOrderId =
    orderId && mongoose.Types.ObjectId.isValid(orderId.toString())
      ? new mongoose.Types.ObjectId(orderId.toString())
      : null;

  const feeTxId = `TXN-FEE-${paymentId.replace(/^pay_/, "")}`;
  const feeIdempotencyKey = `debit_fee_${paymentId}`;

  try {
    await Transaction.findOneAndUpdate(
      { idempotencyKey: feeIdempotencyKey },
      {
        $setOnInsert: {
          transactionId: feeTxId,
          orderId: cleanOrderId,
          paymentId,
          type: "debit",
          category: "gateway_fee",
          amount: totalFee,
          currency: "INR",
          status: "completed",
          description: description || `Payment gateway processing fee for payment ${paymentId}`,
          idempotencyKey: feeIdempotencyKey,
          metadata: {
            feeAmount,
            taxAmount,
            rawPayload,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );
  } catch (feeErr: any) {
    if (feeErr?.code !== 11000) {
      console.error("[LedgerService] Error recording gateway fee transaction:", feeErr);
    }
  }
}
