"use client";

import React, { useState } from "react";
import axios, { AxiosError } from "axios";
import { AlertCircle, AlertTriangle, CheckCircle2, CreditCard, Loader2, X } from "lucide-react";

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    _id: string;
    totalAmount: number;
    paymentMethod?: string;
    paymentStatus?: string;
    status: string;
    recipientName?: string;
    email?: string;
  };
  onSuccess: (updatedOrder?: any) => void;
}

const CANCELLATION_REASONS = [
  "Ordered by mistake",
  "Found a better price elsewhere",
  "Incorrect delivery address or contact number",
  "Need to change product size or color",
  "Estimated delivery time is too long",
  "Changed my mind",
  "Other reason",
];

export default function CancelOrderModal({
  isOpen,
  onClose,
  order,
  onSuccess,
}: CancelOrderModalProps) {
  const [selectedReason, setSelectedReason] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isOnlinePaid =
    order.paymentStatus === "paid" || order.paymentMethod === "online";

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const finalReason =
      selectedReason === "Other reason" && customReason.trim()
        ? customReason.trim()
        : selectedReason;

    try {
      const response = await axios.post(`/api/order/${order._id}/cancel`, {
        reason: finalReason,
      });

      if (response.data?.success) {
        onSuccess(response.data.order);
        onClose();
      } else {
        setError(response.data?.message || "Failed to cancel order.");
      }
    } catch (err: any) {
      if (err instanceof AxiosError) {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Unable to cancel this order. Please try again or contact support."
        );
      } else {
        setError("An unexpected error occurred while cancelling your order.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Cancel Order</h3>
              <p className="text-xs text-gray-500 font-mono">
                Order #{order._id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCancelSubmit} className="mt-4 space-y-4">
          {/* Refund Information Banner */}
          {isOnlinePaid ? (
            <div className="rounded-xl border border-green-200 bg-green-50/80 p-3.5 text-xs text-green-900">
              <div className="flex items-center gap-2 font-semibold text-green-800">
                <CreditCard className="size-4 text-green-600" />
                Automatic Razorpay Refund
              </div>
              <p className="mt-1 leading-relaxed text-green-700">
                Your payment of{" "}
                <strong className="font-bold text-green-900">
                  ₹{Number(order.totalAmount).toFixed(2)}
                </strong>{" "}
                will be automatically refunded to your original source of payment within 5–7 business days.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Cash on Delivery</span>
              <p className="mt-0.5">
                No payment was charged for this order. It will be marked as cancelled immediately.
              </p>
            </div>
          )}

          {/* Reason Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Reason for Cancellation <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={loading}
              className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              {CANCELLATION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Textarea if 'Other' selected */}
          {selectedReason === "Other reason" && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Please tell us more
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe why you want to cancel..."
                rows={2}
                disabled={loading}
                required
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
            >
              Keep Order
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 active:scale-[0.98] transition cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm Cancel"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
