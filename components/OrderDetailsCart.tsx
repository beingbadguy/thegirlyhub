"use client";
import axios, { AxiosError } from "axios";
import { Copy, Check, MapPin, Phone, Truck, CreditCard, Package, ChevronDown, ChevronUp, ExternalLink, Clock, X, Tag } from "lucide-react";
import { useState } from "react";
import { VscLoading } from "react-icons/vsc";

/* ─── Types ────────────────────────────────────────────────────── */
type OrderStatus =
  | "processing"
  | "reviewing"
  | "preparing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

type StatusHistoryEntry = {
  status: OrderStatus;
  changedAt: string;
  note?: string;
};

type Product = {
  productId: {
    _id: string;
    title: string;
    price: number;
    category: string;
    image: string;
    discountPrice?: number;
    discountedPrice?: number;
  };
  quantity: number;
  size?: string;
  title?: string;
  price?: number;
  image?: string;
};

type User = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
};

type Order = {
  _id: string;
  userId: User;
  products: Product[];
  totalAmount: number;
  /** Recorded at checkout */
  subtotal?: number;
  shippingCharge?: number;
  firstOrderDiscount?: number;
  couponDiscount?: number;
  paymentMethod: "cod" | "online" | "credit/debit";
  deliveryType: "normal" | "fast";
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  phone: string;
  email?: string;
  recipientName?: string;
  couponCode?: string;
  status: OrderStatus;
  awbNumber?: string;
  trackingLink?: string;
  statusHistory?: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

/* ─── Constants ─────────────────────────────────────────────────── */
const STATUS_FLOW: OrderStatus[] = [
  "processing",
  "reviewing",
  "preparing",
  "shipped",
  "delivered",
  "completed",
];

const STATUS_LABELS: Record<OrderStatus, string> = {
  processing: "Processing",
  reviewing:  "Reviewing",
  preparing:  "Preparing",
  shipped:    "Shipped",
  delivered:  "Delivered",
  completed:  "Completed",
  cancelled:  "Cancelled",
};

const STATUS_COLORS: Record<OrderStatus, { bg: string; text: string; dot: string }> = {
  processing: { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400"  },
  reviewing:  { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400"   },
  preparing:  { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
  shipped:    { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  delivered:  { bg: "bg-teal-50",   text: "text-teal-700",   dot: "bg-teal-500"   },
  completed:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500"  },
  cancelled:  { bg: "bg-red-50",    text: "text-red-700",    dot: "bg-red-500"    },
};

const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  processing: ["reviewing", "cancelled"],
  reviewing:  ["preparing", "cancelled"],
  preparing:  ["shipped",   "cancelled"],
  shipped:    ["delivered"],
  delivered:  ["completed"],
  completed:  [],
  cancelled:  [],
};

/* ─── AWB Modal ─────────────────────────────────────────────────── */
function AwbModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (awb: string, link: string) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [awb, setAwb] = useState("");
  const [link, setLink] = useState("");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Truck className="w-4 h-4 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-800 text-base">Mark as Shipped</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-5">
          Enter the AWB / tracking number and carrier link to notify the customer.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              AWB / Tracking Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={awb}
              onChange={(e) => setAwb(e.target.value)}
              placeholder="e.g. 123456789012"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
              Tracking Link <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://tracking.carrier.com/..."
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(awb, link)}
            disabled={!awb.trim() || loading}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <VscLoading className="animate-spin" /> : <Truck className="w-4 h-4" />}
            Confirm Shipped
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Status Timeline ───────────────────────────────────────────── */
function StatusTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 py-3">
        <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
          <X className="w-3.5 h-3.5 text-red-500" />
        </div>
        <span className="text-sm font-medium text-red-600">Order Cancelled</span>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-center w-full overflow-x-auto pb-1">
      {STATUS_FLOW.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent   = idx === currentIdx;

        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-pink-600 border-pink-600"
                    : isCurrent
                    ? "bg-white border-pink-600 shadow-[0_0_0_3px_rgba(219,39,119,0.15)]"
                    : "bg-white border-gray-200"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 text-white" />
                ) : isCurrent ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-pink-600" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium whitespace-nowrap ${
                  isCompleted || isCurrent ? "text-pink-700" : "text-gray-400"
                }`}
              >
                {STATUS_LABELS[step]}
              </span>
            </div>

            {idx < STATUS_FLOW.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-1 rounded-full transition-all ${
                  isCompleted ? "bg-pink-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────────── */
export default function OrderDetailsCard({
  order,
  fetchUserOrders,
  isAdmin = false,
}: {
  order: Order;
  fetchUserOrders?: () => void;
  isAdmin?: boolean;
}) {
  const [open, setOpen]         = useState(false);
  const [copied, setCopied]     = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showAwbModal, setShowAwbModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<OrderStatus | null>(null);

  const statusColor = STATUS_COLORS[order.status];
  const nextStatuses = NEXT_STATUSES[order.status];

  const getProductTitle = (item: Product) =>
    item.productId?.title || item.title || "Product";
  const getProductPrice = (item: Product) =>
    item.price ?? item.productId?.discountPrice ?? item.productId?.discountedPrice ?? item.productId?.price ?? 0;
  const getProductImage = (item: Product) =>
    item.productId?.image || item.image || "";

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (newStatus === "shipped") {
      setPendingStatus(newStatus);
      setShowAwbModal(true);
    } else {
      const label = STATUS_LABELS[newStatus];
      if (window.confirm(`Move order to "${label}"?`)) {
        doUpdate(newStatus);
      }
    }
  };

  const doUpdate = async (
    newStatus: OrderStatus,
    awbNumber?: string,
    trackingLink?: string
  ) => {
    setUpdating(true);
    try {
      await axios.patch(`/api/orders/${order._id}/status`, {
        status: newStatus,
        ...(awbNumber ? { awbNumber } : {}),
        ...(trackingLink ? { trackingLink } : {}),
      });
      if (fetchUserOrders) {
        fetchUserOrders();
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        alert(error.response?.data?.message || "Failed to update status");
      } else {
        alert("Failed to update status");
      }
    } finally {
      setUpdating(false);
      setShowAwbModal(false);
      setPendingStatus(null);
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Use recorded values if available, otherwise fall back to computed/estimated values
  const subtotal = order.subtotal ??
    order.products.reduce((acc, item) => acc + getProductPrice(item) * (item.quantity ?? 1), 0);
  const shippingCharge = order.shippingCharge ?? (order.totalAmount < 150 ? 80 : 0);
  const firstOrderDiscount = order.firstOrderDiscount ?? 0;
  const couponDiscount = order.couponDiscount ?? (
    order.couponCode ? Math.max(0, subtotal + shippingCharge - firstOrderDiscount - order.totalAmount) : 0
  );

  return (
    <>
      {/* AWB Modal */}
      {showAwbModal && pendingStatus === "shipped" && (
        <AwbModal
          loading={updating}
          onClose={() => {
            setShowAwbModal(false);
            setPendingStatus(null);
          }}
          onConfirm={(awb, link) => doUpdate("shipped", awb, link)}
        />
      )}

      <article className="bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">

        {/* ── Header Bar ── */}
        <div className="px-5 py-4 flex flex-wrap items-start gap-3 border-b border-gray-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order</span>
              <code className="text-xs font-mono font-semibold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-lg truncate max-w-[180px]">
                #{order._id}
              </code>
              <button
                title="Copy order ID"
                onClick={() => {
                  navigator.clipboard.writeText(order._id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }}
                className="p-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-400">{formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <p className="text-xs text-gray-400 font-medium">Total</p>
              <p className="text-base font-bold text-gray-800">₹{order.totalAmount.toFixed(2)}</p>
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusColor.bg} ${statusColor.text}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor.dot}`} />
              {STATUS_LABELS[order.status]}
            </span>

            <button
              onClick={() => setOpen((o) => !o)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {open ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
        </div>

        {/* ── Quick Info Row ── */}
        <div className="px-5 py-3 flex flex-wrap items-center gap-x-6 gap-y-1.5 bg-gray-50/60 border-b border-gray-100 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[order.address, order.city, order.state].filter(Boolean).join(", ")}
            {order.zip && ` – ${order.zip}`}
          </span>
          <span className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            {order.phone}
          </span>
          {order.deliveryType === "fast" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full font-semibold">
              <Truck className="w-3 h-3" /> Express Delivery
            </span>
          )}
        </div>

        {/* ── Expanded Panel ── */}
        {open && (
          <div className="px-5 py-5 space-y-6">

            {/* Status Timeline */}
            <section>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                Order Progress
              </h4>
              <StatusTimeline currentStatus={order.status} />
            </section>

            {/* Shipment Tracking Card (when shipped) */}
            {order.awbNumber && (
              <section className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Truck className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs text-indigo-500 font-medium">AWB / Tracking Number</p>
                      <p className="text-sm font-bold text-indigo-800 font-mono tracking-widest">
                        {order.awbNumber}
                      </p>
                    </div>
                  </div>
                  {order.trackingLink && (
                    <a
                      href={order.trackingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Track Shipment
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Status History */}
            {order.statusHistory && order.statusHistory.length > 0 && (
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Status History
                </h4>
                <div className="space-y-2">
                  {[...order.statusHistory].reverse().map((entry, i) => {
                    const c = STATUS_COLORS[entry.status];
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                        <span className={`text-xs font-semibold ${c.text}`}>
                          {STATUS_LABELS[entry.status]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(entry.changedAt).toLocaleString("en-IN", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                        {entry.note && (
                          <span className="text-xs text-gray-400 italic">— {entry.note}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Products + Right column grid */}
            <div className="grid md:grid-cols-2 gap-6">

              {/* Products */}
              <section>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Items ({order.products.length})
                </h4>
                <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {order.products.map((item, i) => (
                    <li key={i} className="flex gap-3 items-start p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                      <div className="w-14 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={getProductImage(item)}
                          alt={getProductTitle(item)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">
                          {getProductTitle(item)}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <span className="text-xs text-pink-600 font-semibold">
                            ₹{getProductPrice(item).toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-400">×{item.quantity ?? 1}</span>
                          {item.size && item.size.toLowerCase() !== "one size" && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                              {item.size}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 font-medium">
                          Subtotal: ₹{(getProductPrice(item) * (item.quantity ?? 1)).toFixed(2)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Right column */}
              <div className="space-y-5">

                {/* Order Summary — real recorded values */}
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                    Order Summary
                  </h4>
                <div className="rounded-xl border border-gray-100 overflow-hidden text-sm">
                  <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-50 text-gray-600">
                    <span>Items ({order.products.length})</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  
                  {shippingCharge > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-50 text-gray-600">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-gray-400" /> Delivery charge
                      </span>
                      <span>₹{shippingCharge.toFixed(2)}</span>
                    </div>
                  )}

                  {firstOrderDiscount > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-50 text-green-600">
                      <span>First order discount (15%)</span>
                      <span>–₹{firstOrderDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  {couponDiscount > 0 && (
                    <div className="flex justify-between items-center px-4 py-2.5 border-b border-gray-50 text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        Coupon
                        {order.couponCode && (
                          <code className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            {order.couponCode.toUpperCase()}
                          </code>
                        )}
                      </span>
                      <span>–₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center px-4 py-3 bg-gray-50 font-bold">
                    <span className="text-gray-800">Total</span>
                    <span className="text-pink-600 text-base">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                </section>

                {/* Shipping Details */}
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Shipping Details
                  </h4>
                  <div className="rounded-xl bg-gray-50/80 border border-gray-100 px-4 py-3 space-y-1.5 text-sm text-gray-600">
                    <p className="font-semibold text-gray-800">{order.recipientName || order.userId?.name}</p>
                    <p>{order.address}{order.city ? `, ${order.city}` : ""}{order.state ? `, ${order.state}` : ""}</p>
                    {order.zip && <p>PIN: {order.zip}</p>}
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> {order.phone}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        order.deliveryType === "fast"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        <Truck className="w-3 h-3" />
                        {order.deliveryType === "fast" ? "⚡ Express" : "Standard"} Delivery
                      </span>
                    </div>
                  </div>
                </section>

                {/* Payment */}
                <section>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Payment
                  </h4>
                  <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 border border-gray-100 px-4 py-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                      order.paymentMethod === "cod" ? "bg-amber-500" : "bg-blue-600"
                    }`}>
                      {order.paymentMethod === "cod" ? "COD" : "ONL"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {order.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment"}
                      </p>
                      {order.paymentMethod !== "cod" && (
                        <p className="text-xs text-gray-400">Card / UPI / Net Banking</p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* ── Admin Action Bar ── */}
            {isAdmin && nextStatuses.length > 0 && (
              <section className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                  Update Status
                </h4>
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((s) => {
                    const isCancelAction = s === "cancelled";
                    return (
                      <button
                        key={s}
                        disabled={updating}
                        onClick={() => handleStatusChange(s)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                          isCancelAction
                            ? "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                            : "bg-pink-600 text-white hover:bg-pink-700 shadow-sm"
                        }`}
                      >
                        {updating ? (
                          <VscLoading className="animate-spin w-3.5 h-3.5" />
                        ) : isCancelAction ? (
                          <X className="w-3.5 h-3.5" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Move to {STATUS_LABELS[s]}
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Terminal states */}
            {isAdmin && nextStatuses.length === 0 && (
              <div
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                  order.status === "completed"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {order.status === "completed" ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                {order.status === "completed"
                  ? "Order completed — no further actions needed."
                  : "This order has been cancelled."}
              </div>
            )}
          </div>
        )}
      </article>
    </>
  );
}
