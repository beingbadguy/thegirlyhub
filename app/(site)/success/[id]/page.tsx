"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import confetti from "canvas-confetti";
import {
  Check,
  CheckCheck,
  Copy,
  Sparkles,
  ShieldCheck,
  UserRound,
  MapPin,
  PhoneCall,
  PackageCheck,
  House,
  Truck,
  ShoppingBag,
  Clock,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  Phone,
  Mail,
  ArrowRight,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/store";
import { productUrl } from "@/lib/slug";
import { SITE_CONFIG } from "@/lib/seo/config";
import CancelOrderModal from "@/components/CancelOrderModal";

interface OrderProductItem {
  productId?: {
    _id?: string;
    title?: string;
    slug?: string;
    image?: string;
    images?: string[];
    price?: number;
    discountedPrice?: number;
    category?: string;
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
  firstOrderDiscount?: number;
  couponDiscount?: number;
  recipientName?: string;
  email?: string;
  phone?: string | number;
  address?: string;
  city?: string;
  state?: string;
  landmark?: string;
  zip?: string | number;
  products?: OrderProductItem[];
  status?: string;
  createdAt?: string;
  trackingLink?: string;
  awbNumber?: string;
}

interface RecommendedItem {
  _id: string;
  title: string;
  slug?: string;
  price: number;
  discountedPrice: number;
  discountPercentage?: number;
  image: string;
  category?: string;
}

export default function OrderConfirmedPage() {
  const params = useParams();
  const rawId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const router = useRouter();
  const { user, fetchUser } = useAuthStore();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [recommended, setRecommended] = useState<RecommendedItem[]>([]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Fetch Order Details
  useEffect(() => {
    if (!rawId) return;
    let isMounted = true;

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/order/${rawId}`);
        const data = await response.json();
        if (isMounted && data.success && data.order) {
          setOrder(data.order);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [rawId]);

  // Fetch Recommendations
  useEffect(() => {
    let isMounted = true;
    const fetchRecs = async () => {
      try {
        const response = await fetch("/api/product/recommend?limit=3");
        const data = await response.json();
        if (isMounted && data.success && Array.isArray(data.products)) {
          setRecommended(data.products);
        }
      } catch (err) {
        console.error("Error fetching recommendations:", err);
      }
    };
    fetchRecs();
    return () => {
      isMounted = false;
    };
  }, []);

  // Celebration Chime & Confetti
  useEffect(() => {
    // Play success sound
    try {
      const audio = new Audio("/success.mp3");
      audio.volume = 0.2;
      audio.play().catch(() => {
        // Handle autoplay policy block gracefully
      });
    } catch {
      // Audio error ignored
    }

    // Confetti shower
    const duration = 3.5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 999 };

    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const interval: number = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 45 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.35), y: Math.random() - 0.2 },
        colors: ["#ec4899", "#f43f5e", "#fb7185", "#fde047", "#f472b6"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.65, 0.9), y: Math.random() - 0.2 },
        colors: ["#ec4899", "#d946ef", "#fb7185", "#f59e0b", "#fbcfe8"],
      });
    }, 220);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const orderId = order?._id || rawId || "GH-PENDING";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore copy error
    }
  };

  const formattedDate = useMemo(() => {
    const d = order?.createdAt ? new Date(order.createdAt) : new Date();
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, [order?.createdAt]);

  const totalItemsCount = useMemo(() => {
    if (!order?.products || order.products.length === 0) return 0;
    return order.products.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [order?.products]);

  const customerName =
    order?.recipientName || user?.name || "Gorgeous Customer";
  const customerEmail =
    order?.email || user?.email || "your registered email";
  const customerPhone =
    order?.phone || user?.phone || "Not specified";

  const subtotalCalc = useMemo(() => {
    if (order?.subtotal) return order.subtotal;
    if (order?.products && order.products.length > 0) {
      return order.products.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
        0
      );
    }
    return order?.totalAmount || 0;
  }, [order]);

  const discountAmount =
    (order?.firstOrderDiscount || 0) + (order?.couponDiscount || 0);

  return (
    <div className="page-shell relative w-full min-h-screen overflow-x-hidden text-[#402537] font-sans pb-16">
      {/* Dynamic CSS Styling tokens for GirlyHub aesthetic */}
      <style jsx global>{`
        :root {
          --ink: #402537;
          --muted: #806475;
          --pink: #ec4899;
          --rose: #fdf0f6;
          --line: #f4d9e7;
          --gold: #b98742;
        }
        .editorial {
          font-family: var(--font-bodoni-moda), var(--font-instrument-serif), "Playfair Display", Georgia, serif;
        }
        .page-shell {
          background:
            radial-gradient(circle at 7% 2%, rgba(251, 207, 232, 0.75) 0, rgba(251, 207, 232, 0) 22rem),
            radial-gradient(circle at 94% 20%, rgba(254, 230, 206, 0.78) 0, rgba(254, 230, 206, 0) 24rem),
            #fffafd;
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.88);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 16px 45px rgba(116, 57, 88, 0.08);
          backdrop-filter: blur(14px);
        }
        .soft-card {
          background: rgba(255, 255, 255, 0.92);
          border: 1px solid var(--line);
          box-shadow: 0 12px 34px rgba(116, 57, 88, 0.06);
        }
        .confetti-pill {
          position: absolute;
          width: 10px;
          height: 18px;
          border-radius: 8px;
          opacity: 0.72;
          animation: drift 6s ease-in-out infinite;
          pointer-events: none;
        }
        .c1 { left: 6%; top: 10%; background: #ec4899; transform: rotate(22deg); }
        .c2 { left: 14%; top: 26%; background: #f8c77d; transform: rotate(-30deg); animation-delay: -2s; }
        .c3 { right: 10%; top: 12%; background: #f6b8d6; animation-delay: -3.5s; }
        .c4 { right: 6%; top: 34%; background: #d9a75d; transform: rotate(35deg); animation-delay: -1s; }
        .c5 { left: 4%; top: 68%; background: #ffd7e9; animation-delay: -4s; }
        @keyframes drift {
          0%, 100% { translate: 0 0; rotate: 0deg; }
          50% { translate: 8px 18px; rotate: 26deg; }
        }
        .reveal {
          animation: rise 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        @keyframes rise {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .success-orb {
          box-shadow: 0 0 0 11px rgba(252, 211, 233, 0.45), 0 0 38px rgba(236, 72, 153, 0.25);
        }
        .action-button {
          transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }
        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(236, 72, 153, 0.18);
        }
        .action-button:active {
          transform: translateY(0);
        }
        .tracking-panel {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.45s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease, margin 0.3s ease;
        }
        .tracking-panel.is-open {
          max-height: 400px;
          opacity: 1;
          margin-top: 1.25rem;
        }
        .support-panel {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.35s ease, opacity 0.3s ease;
        }
        .support-panel.is-open {
          max-height: 300px;
          opacity: 1;
          margin-top: 0.75rem;
        }
        .product-photo {
          background: #fff0f7;
        }
      `}</style>

      {/* Floating Confetti Accents */}
      <span className="confetti-pill c1" aria-hidden="true" />
      <span className="confetti-pill c2" aria-hidden="true" />
      <span className="confetti-pill c3" aria-hidden="true" />
      <span className="confetti-pill c4" aria-hidden="true" />
      <span className="confetti-pill c5" aria-hidden="true" />

  
      {/* Main Container */}
      <main className="mx-auto w-full max-w-5xl px-4 pt-8 sm:px-8">
        {/* Hero Celebration Section */}
        <section className="reveal mx-auto max-w-2xl text-center">
          <div className="success-orb mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-500 text-white transition-transform duration-300 hover:scale-105">
            <Check className="size-10 stroke-[2.5]" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.22em] text-pink-600">
            ORDER CONFIRMED • CASH ON DELIVERY
          </p>
          <h1 className="editorial mt-2.5 text-3xl font-bold leading-tight text-[#402537] sm:text-4xl lg:text-5xl">
            Thanks {customerName}, Your Order is Confirmed!
          </h1>
          <p className="mx-auto mt-3.5 max-w-lg text-sm sm:text-base leading-relaxed text-[#806475]">
            We&apos;ve safely received your Cash on Delivery request. Our team will verify and prepare your parcel with love! All updates will be sent to{" "}
            <span className="font-semibold text-[#402537] break-all">{customerEmail}</span>.
          </p>
        </section>

        {/* Order Summary Glass Card */}
        <section className="reveal delay-1 mx-auto mt-8 max-w-4xl">
          <article className="glass-card rounded-[28px] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-rose-100 pb-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400">
                  ORDER REFERENCE
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2.5">
                  <p className="font-mono text-lg sm:text-xl font-bold tracking-wide text-[#402537]">
                    {orderId}
                  </p>
                  <button
                    id="copy-order-button"
                    type="button"
                    onClick={handleCopy}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
                      copied
                        ? "bg-emerald-100 text-emerald-700 shadow-sm"
                        : "bg-pink-50 text-pink-600 hover:bg-pink-100"
                    }`}
                    aria-label="Copy order ID"
                  >
                    {copied ? (
                      <>
                        <CheckCheck className="size-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" />
                        <span>Copy ID</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-pink-50 px-4 py-2 text-xs sm:text-sm font-bold text-pink-700 border border-pink-100 shadow-sm">
                <span className="size-2 rounded-full bg-pink-500 animate-pulse" />
                COD Order Placed
              </span>
            </div>

            {/* 3 Columns Order Meta */}
            <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/60 p-3.5 border border-rose-50">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a48597]">
                  ORDER DATE
                </p>
                <p className="mt-1 font-bold text-sm text-[#402537]">{formattedDate}</p>
              </div>
              <div className="rounded-2xl bg-white/60 p-3.5 border border-rose-50">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a48597]">
                  PAYMENT METHOD
                </p>
                <p className="mt-1 font-bold text-sm text-[#402537]">Cash on Delivery (COD)</p>
              </div>
              <div className="rounded-2xl bg-white/60 p-3.5 border border-rose-50">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#a48597]">
                  ESTIMATED DELIVERY
                </p>
                <p className="mt-1 font-bold text-sm text-[#402537]">3 – 5 Business Days</p>
              </div>
            </div>
          </article>
        </section>

        {/* Customer Info & Delivery Address Grid */}
        <section id="details" className="reveal delay-2 mt-6 grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {/* Customer Details */}
          <article className="soft-card rounded-[25px] p-6">
            <div className="flex items-center gap-3 border-b border-rose-50 pb-3">
              <div className="rounded-xl bg-pink-50 p-2.5 text-pink-500">
                <UserRound className="size-5" />
              </div>
              <h2 className="editorial text-xl font-bold text-[#402537]">
                Customer Details
              </h2>
            </div>
            <div className="mt-4 space-y-2.5 text-sm leading-relaxed">
              <p className="font-bold text-base text-[#402537]">{customerName}</p>
              <div className="flex items-center gap-2 text-[#806475]">
                <Mail className="size-4 text-pink-400 shrink-0" />
                <span className="break-all">{customerEmail}</span>
              </div>
              <div className="flex items-center gap-2 text-[#806475]">
                <Phone className="size-4 text-pink-400 shrink-0" />
                <span>+91 {customerPhone}</span>
              </div>
            </div>
          </article>

          {/* Delivery Address */}
          <article className="soft-card rounded-[25px] p-6">
            <div className="flex items-center gap-3 border-b border-rose-50 pb-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-[#b98742]">
                <MapPin className="size-5" />
              </div>
              <h2 className="editorial text-xl font-bold text-[#402537]">
                Delivery Address
              </h2>
            </div>
            <address className="mt-4 not-italic text-sm leading-relaxed text-[#806475] space-y-1">
              <p className="font-semibold text-[#402537]">
                {order?.address || "Address provided at checkout"}
              </p>
              {order?.landmark && (
                <p className="text-xs text-[#a48597]">
                  <span className="font-medium">Landmark:</span> {order.landmark}
                </p>
              )}
              <p>
                {order?.city ? `${order.city}, ` : ""}
                {order?.state || ""}
                {order?.zip ? ` - ${order.zip}` : ""}
              </p>
              <p className="text-xs font-semibold text-pink-600 mt-2">
                India 🇮🇳
              </p>
            </address>
          </article>
        </section>

        {/* Order Items & Price Summary Card */}
        <section className="reveal delay-3 mt-6 max-w-4xl mx-auto">
          <article className="soft-card rounded-[28px] p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rose-100 pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400">
                  YOUR SELECTION
                </p>
                <h2 className="editorial mt-1 text-2xl sm:text-3xl font-bold text-[#402537]">
                  Items In Your Order
                </h2>
              </div>
              <p className="text-xs sm:text-sm font-bold text-[#806475] bg-rose-50 px-3 py-1 rounded-full">
                {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}
              </p>
            </div>

            {/* Products List */}
            <div className="divide-y divide-rose-100/70">
              {order?.products && order.products.length > 0 ? (
                order.products.map((item, index) => {
                  const p = item.productId;
                  const itemTitle = item.title || p?.title || "GirlyHub Accessory";
                  const itemImg = item.image || p?.image || "/placeholder.png";
                  const itemPrice = Number(item.price || p?.discountedPrice || p?.price || 0);
                  const itemQty = item.quantity || 1;
                  const itemUrl = p ? productUrl(itemTitle, p._id, p.slug) : "#";

                  return (
                    <div key={index} className="flex items-center gap-4 py-4 sm:py-5">
                      <div className="product-photo h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-rose-100 shadow-sm relative">
                        <Image
                          src={itemImg}
                          alt={itemTitle}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 sm:flex-row sm:items-center">
                        <div>
                          {p ? (
                            <Link
                              href={itemUrl}
                              className="font-bold text-sm sm:text-base text-[#402537] hover:text-pink-600 transition-colors line-clamp-1"
                            >
                              {itemTitle}
                            </Link>
                          ) : (
                            <h3 className="font-bold text-sm sm:text-base text-[#402537] line-clamp-1">
                              {itemTitle}
                            </h3>
                          )}
                          {item.size && (
                            <p className="mt-0.5 text-xs text-[#806475]">
                              Variant / Size: <span className="font-semibold text-[#402537]">{item.size}</span>
                            </p>
                          )}
                          <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[#a48597]">
                            QTY: {itemQty}
                          </p>
                        </div>
                        <p className="whitespace-nowrap font-bold text-base text-pink-600 sm:text-right">
                          ₹{(itemPrice * itemQty).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-[#806475] text-sm">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-6 animate-spin rounded-full border-2 border-pink-200 border-t-pink-600" />
                      <span>Loading order items...</span>
                    </div>
                  ) : (
                    <p>Order registered. Items are being packed for shipment.</p>
                  )}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="ml-auto mt-4 max-w-sm space-y-2.5 border-t border-rose-100 pt-5 text-sm">
              <div className="flex justify-between text-[#806475]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#402537]">
                  ₹{subtotalCalc.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between text-[#806475]">
                <span>Shipping Charge</span>
                <span className={`font-semibold ${order?.shippingCharge === 0 || !order?.shippingCharge ? "text-emerald-600 font-bold" : "text-[#402537]"}`}>
                  {order?.shippingCharge === 0 || !order?.shippingCharge ? "FREE" : `₹${order.shippingCharge}`}
                </span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-pink-600 font-medium">
                  <span>Discount Applied</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}

              <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-pink-50 to-rose-100/70 px-4 py-3.5 border border-pink-100">
                <div>
                  <span className="font-bold text-sm text-[#402537] block">
                    Cash to Pay at Delivery
                  </span>
                  <span className="text-[11px] text-[#806475]">
                    (Exact cash or UPI upon delivery)
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-pink-600">
                  ₹{(order?.totalAmount ?? subtotalCalc).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </article>
        </section>

        {/* Special COD Advisory Banner */}
        <section className="reveal delay-3 mt-6 max-w-4xl mx-auto">
          <aside className="soft-card flex items-start gap-4 rounded-[24px] border border-amber-200/80 bg-amber-50/50 p-5">
            <div className="mt-0.5 rounded-full bg-white p-2.5 text-[#b98742] shadow-sm shrink-0 border border-amber-100">
              <PhoneCall className="size-5" />
            </div>
            <div>
              <h2 className="font-bold text-amber-950 text-base sm:text-lg flex items-center gap-2">
                Verification Call for Cash on Delivery Orders
              </h2>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-amber-900/90">
                To guarantee safe delivery, <strong>GirlyHub</strong> support will call or WhatsApp you at{" "}
                <span className="font-bold text-amber-950">+91 {customerPhone}</span> to confirm your delivery address before dispatching your package. Please keep the exact cash amount ready!
              </p>
            </div>
          </aside>
        </section>

        {/* Action Buttons & Expandable Panels */}
        <section className="reveal delay-4 mt-8 text-center max-w-4xl mx-auto">
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <button
              id="continue-button"
              type="button"
              onClick={() => {
                const el = document.getElementById("recommended");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                } else {
                  router.push("/product");
                }
              }}
              className="action-button rounded-full bg-pink-500 hover:bg-pink-600 text-white px-7 py-3.5 font-bold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
            >
              <ShoppingBag className="size-4" />
              Continue Shopping
            </button>

            <button
              id="track-button"
              type="button"
              onClick={() => setTrackingOpen((prev) => !prev)}
              aria-expanded={trackingOpen}
              className="action-button rounded-full border border-pink-200 bg-white hover:bg-pink-50 text-[#402537] px-7 py-3.5 font-bold text-sm shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <Truck className="size-4 text-pink-500" />
              {trackingOpen ? "Hide Tracking" : "Track Order Status"}
              <ChevronDown className={`size-4 transition-transform duration-200 ${trackingOpen ? "rotate-180" : ""}`} />
            </button>

            <button
              id="profile-button"
              type="button"
              onClick={() => {
                if (user) {
                  router.push("/profile");
                } else {
                  router.push("/track");
                }
              }}
              className="action-button rounded-full border border-rose-200 bg-white hover:bg-rose-50 text-[#402537] px-7 py-3.5 font-bold text-sm shadow-sm cursor-pointer flex items-center justify-center gap-2"
            >
              <UserRound className="size-4 text-pink-500" />
              {user ? "View All Orders" : "Track via Phone / ID"}
            </button>

            {order &&
              order.status !== "shipped" &&
              order.status !== "delivered" &&
              order.status !== "completed" &&
              order.status !== "cancelled" && (
                <button
                  id="cancel-order-button"
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="action-button rounded-full border border-red-200 bg-red-50/70 hover:bg-red-100 text-red-700 px-7 py-3.5 font-bold text-sm shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <X className="size-4 text-red-500" />
                  Cancel Order
                </button>
              )}
          </div>

          {/* Interactive Multi-Stage Tracking Accordion */}
          <div
            id="tracking-panel"
            className={`tracking-panel mx-auto max-w-2xl text-left ${
              trackingOpen ? "is-open" : ""
            }`}
          >
            <div className="soft-card rounded-[24px] p-5 sm:p-6 bg-white">
              <div className="flex items-center justify-between border-b border-rose-100 pb-3">
                <p className="font-bold text-[#402537] text-sm sm:text-base flex items-center gap-2">
                  <Clock className="size-4 text-pink-500" />
                  Order Progress Timeline
                </p>
                <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full">
                  Status: {order?.status ? order.status.toUpperCase() : "PROCESSING"}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                {/* Stage 1 */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-white shadow-md">
                    <Check className="size-5 stroke-[2.5]" />
                  </div>
                  <p className="mt-2.5 font-bold text-[#402537]">Order Placed</p>
                  <p className="text-[11px] text-[#806475] mt-0.5">Confirmed & Logged</p>
                </div>

                {/* Stage 2 */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 text-pink-600 border border-pink-200">
                    <PackageCheck className="size-5" />
                  </div>
                  <p className="mt-2.5 font-bold text-[#402537]">Verification & Packing</p>
                  <p className="text-[11px] text-[#806475] mt-0.5">Call & Quality Check</p>
                </div>

                {/* Stage 3 */}
                <div className="flex flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-50 text-pink-300">
                    <House className="size-5" />
                  </div>
                  <p className="mt-2.5 font-bold text-[#806475]">Out for Delivery</p>
                  <p className="text-[11px] text-[#a48597] mt-0.5">Delivering to doorstep</p>
                </div>
              </div>

              {order?.trackingLink && (
                <div className="mt-5 pt-4 border-t border-rose-100 text-center">
                  <a
                    href={order.trackingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 underline underline-offset-4"
                  >
                    <span>Track Live Courier Tracking</span>
                    <ExternalLink className="size-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recommended Products ("Complete Your Look") */}
        <section id="recommended" className="reveal delay-4 mt-16 max-w-4xl mx-auto">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end border-b border-rose-100 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400">
                HANDPICKED FOR YOU
              </p>
              <h2 className="editorial mt-1 text-2xl sm:text-3xl font-bold text-[#402537]">
                Complete Your Look
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-[#806475]">
              More aesthetic accessories you might adore ✨
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {recommended && recommended.length > 0 ? (
              recommended.map((item) => {
                const itemHref = productUrl(item.title, item._id, item.slug);
                return (
                  <Link
                    key={item._id}
                    href={itemHref}
                    className="group soft-card overflow-hidden rounded-[24px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-pink-50">
                      <Image
                        src={item.image || "/placeholder.png"}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {item.discountPercentage && item.discountPercentage > 0 ? (
                        <span className="absolute top-3 left-3 bg-pink-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                          {Math.floor(item.discountPercentage)}% Off
                        </span>
                      ) : null}
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        {item.category && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500 block mb-1">
                            {item.category}
                          </span>
                        )}
                        <h3 className="font-bold text-sm text-[#402537] group-hover:text-pink-600 transition-colors line-clamp-1">
                          {item.title}
                        </h3>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-base text-pink-600">
                            ₹{item.discountedPrice || item.price}
                          </span>
                          {item.price > item.discountedPrice && (
                            <span className="text-xs text-neutral-400 line-through">
                              ₹{item.price}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-pink-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                          View <ArrowRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              // Fallback cards if recommendation API is loading or empty
              [1, 2, 3].map((n) => (
                <div key={n} className="soft-card p-4 rounded-[23px] animate-pulse">
                  <div className="h-44 bg-pink-100/60 rounded-xl mb-3" />
                  <div className="h-4 bg-pink-100/60 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-pink-100/60 rounded w-1/3" />
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Footer Support Section */}
      <footer className="w-full px-4 pt-12 sm:px-8">
        <div className="mx-auto max-w-4xl border-t border-rose-100 pt-6 text-center">
          <button
            id="help-button"
            type="button"
            onClick={() => setSupportOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-pink-600 hover:text-pink-700 underline decoration-pink-300 underline-offset-4 cursor-pointer"
          >
            <HelpCircle className="size-4" />
            Need help with your order? Click here
          </button>

          <div
            id="support-message"
            className={`support-panel mx-auto max-w-md ${
              supportOpen ? "is-open" : ""
            }`}
          >
            <div className="soft-card p-4 rounded-2xl text-xs sm:text-sm text-[#806475] space-y-2 text-center mt-3">
              <p className="font-semibold text-[#402537]">GirlyHub Customer Support</p>
              <p>
                Have questions, changes to address, or want to modify your order? Reach out anytime!
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-xs">
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="font-bold text-pink-600 hover:underline flex items-center gap-1"
                >
                  <Mail className="size-3.5" /> {SITE_CONFIG.contact.email}
                </a>
                <span className="hidden sm:inline text-rose-300">•</span>
                <a
                  href={`https://wa.me/${SITE_CONFIG.contact.phone.replace(/\+/g, "")}?text=Hi%20GirlyHub,%20I%20have%20a%20question%20about%20my%20order%20${encodeURIComponent(orderId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="size-3.5" /> WhatsApp Support
                </a>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs text-[#a48597]">
            GirlyHub • Handcrafted with love • Thank you for shopping with us!
          </p>
        </div>
      </footer>

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
    </div>
  );
}
