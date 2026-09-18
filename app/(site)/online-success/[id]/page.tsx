"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle, Copy, Check, Printer, ShoppingBag, Truck, ShieldCheck, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useAuthStore } from "@/store/store";
import CancelOrderModal from "@/components/CancelOrderModal";
import FloralAccent from "@/components/decorations/FloralAccent";

interface OrderItem {
  productId?: {
    _id?: string;
    title?: string;
    image?: string;
  };
  title?: string;
  price?: number;
  quantity?: number;
  size?: string;
  image?: string;
}

interface OrderData {
  _id: string;
  paymentId?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  totalAmount?: number;
  subtotal?: number;
  shippingCharge?: number;
  couponDiscount?: number;
  recipientName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  products?: OrderItem[];
  status?: string;
  createdAt?: string;
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [copiedPayId, setCopiedPayId] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (!rawId) return;

    let isMounted = true;
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/order/${rawId}`);
        const data = await response.json();
        if (isMounted && data.success && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [rawId]);

  useEffect(() => {
    // Play success chime safely
    try {
      const audio = new Audio("/success.mp3");
      audio.volume = 0.15;
      audio.play().catch(() => {
        // Ignored browser autoplay policy blocks
      });
    } catch {
      // Audio playback ignore error
    }

    // Trigger celebratory confetti
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: number = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 40 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const displayPaymentId = order?.paymentId || (rawId?.startsWith("pay_") ? rawId : undefined);
  const displayOrderId = order?._id || (!rawId?.startsWith("pay_") ? rawId : undefined);

  return (
    <div className="min-h-[75vh] md:min-h-[85vh] bg-gradient-to-b from-pink-50/50 via-gray-50 to-white text-gray-800 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      <div className="pointer-events-none absolute top-6 right-6 opacity-40 sm:opacity-75">
        <FloralAccent flower={2} size="lg" variant="float" />
      </div>
      <div className="pointer-events-none absolute bottom-6 left-6 opacity-35 sm:opacity-70">
        <FloralAccent flower={1} size="lg" variant="float-delayed" />
      </div>

      <main className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10 relative overflow-hidden z-10">
        {/* Accent top gradient bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-emerald-400 to-teal-500" />

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="size-14 sm:size-16 rounded-2xl bg-green-50 border border-green-200/80 flex items-center justify-center text-green-600 shadow-sm shrink-0">
              <CheckCircle className="size-8 sm:size-9" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                  Payment Successful
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                  <ShieldCheck className="size-3.5" />
                  Verified
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                We are processing your order! 🎉
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right text-xs sm:text-sm text-gray-500">
            <p className="font-medium text-gray-700">Date</p>
            <p>
              {new Date().toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </header>

        {/* Customer greeting */}
        <div className="my-6 p-4 rounded-2xl bg-pink-50/60 border border-pink-100/80 text-center sm:text-left">
          <p className="text-base font-semibold text-gray-900">
            Thanks {order?.recipientName || user?.name || "Customer"}, your online payment was completed!
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            We have sent your confirmation receipt and tracking updates to{" "}
            <span className="font-semibold text-gray-800">{order?.email || user?.email || "your email"}</span>.
          </p>
        </div>

        {/* IDs Card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {displayPaymentId && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-500">Payment ID</span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="font-mono text-xs sm:text-sm font-semibold text-gray-800 truncate">
                  {displayPaymentId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(displayPaymentId);
                    setCopiedPayId(true);
                    setTimeout(() => setCopiedPayId(false), 1500);
                  }}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
                  title="Copy Payment ID"
                >
                  {copiedPayId ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          {displayOrderId && (
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/70 flex flex-col justify-between">
              <span className="text-xs font-medium text-gray-500">Order ID</span>
              <div className="flex items-center justify-between gap-2 mt-1">
                <span className="font-mono text-xs sm:text-sm font-semibold text-gray-800 truncate">
                  {displayOrderId}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(displayOrderId);
                    setCopiedOrderId(true);
                    setTimeout(() => setCopiedOrderId(false), 1500);
                  }}
                  className="p-1 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition"
                  title="Copy Order ID"
                >
                  {copiedOrderId ? (
                    <Check className="size-4 text-green-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Details Preview if loaded */}
        {order && order.totalAmount !== undefined && (
          <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="flex justify-between items-center text-sm pb-2 border-b border-gray-200/60 font-medium text-gray-700">
              <span>Amount Paid</span>
              <span className="text-base font-bold text-gray-900">
                ₹{order.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            {order.products && order.products.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Items ({order.products.reduce((acc, p) => acc + (p.quantity || 1), 0)})
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {order.products.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs text-gray-700">
                      <span className="truncate max-w-[240px] sm:max-w-xs">
                        {item.title || item.productId?.title || "Item"} {item.size ? `(${item.size})` : ""} × {item.quantity || 1}
                      </span>
                      <span className="font-medium text-gray-900 ml-2 shrink-0">
                        ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Printer className="size-4" />
            Print Receipt
          </button>

          <button
            onClick={() => router.push(user ? "/profile" : "/track")}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-3 border border-pink-600 bg-pink-600 hover:bg-pink-700 text-white text-sm font-semibold shadow-sm transition cursor-pointer"
          >
            <Truck className="size-4" />
            {user ? "View Orders" : "Track Order"}
          </button>
        </div>

        <div className="mt-3">
          <Link
            href="/"
            className="w-full text-center inline-flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-black transition shadow-sm"
          >
            <ShoppingBag className="size-4" />
            Continue Shopping
          </Link>
        </div>

        {order &&
          order.status !== "shipped" &&
          order.status !== "delivered" &&
          order.status !== "completed" &&
          order.status !== "cancelled" && (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition cursor-pointer"
              >
                <X className="size-3.5" />
                Cancel Order
              </button>
            </div>
          )}

        {order && order.status === "cancelled" && (
          <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-center text-xs font-semibold text-red-700">
            This order has been cancelled.
          </div>
        )}

        {/* Cancel Order Modal */}
        {order && (
          <CancelOrderModal
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            order={{
              _id: order._id,
              totalAmount: order.totalAmount || 0,
              paymentMethod: order.paymentMethod || "online",
              paymentStatus: order.paymentStatus || "paid",
              status: order.status || "confirmed",
              recipientName: order.recipientName,
              email: order.email,
            }}
            onSuccess={(updated) => {
              if (updated) {
                setOrder(updated);
              } else {
                setOrder((prev) => (prev ? { ...prev, status: "cancelled" } : null));
              }
            }}
          />
        )}

        {/* Footer */}
        <footer className="mt-8 text-xs text-gray-500 border-t border-gray-100 pt-4">
          <p>
            If you have any questions about your order, reply to the email confirmation or contact support. Keep your{" "}
            {displayPaymentId ? "Payment ID " : "Order ID "}
            <span className="font-semibold text-pink-600">
              ({displayPaymentId || displayOrderId})
            </span>{" "}
            handy.
          </p>
          <p className="mt-2 text-[11px] text-gray-400">
            This is an automated digital receipt — no signature required.
          </p>
        </footer>
      </main>
    </div>
  );
}
