"use client";
import { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { FaSearch } from "react-icons/fa";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { MdErrorOutline } from "react-icons/md";
import { BsBoxSeam } from "react-icons/bs";
import { Check, X, Clock, MapPin, Truck, CreditCard, Tag } from "lucide-react";

type OrderStatus =
  | "processing"
  | "reviewing"
  | "preparing"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

type Order = {
  _id: string;
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  shippingCharge?: number;
  firstOrderDiscount?: number;
  couponDiscount?: number;
  couponCode?: string;
  paymentMethod?: string;
  deliveryType?: string;
  recipientName?: string;
  phone?: string;
  createdAt: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  awbNumber?: string;
  trackingLink?: string;
  products: {
    productId?: { _id: string; title: string; price: number; image: string };
    image?: string;
    title?: string;
    quantity: number;
    price?: number;
    size?: string;
  }[];
};

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

function StatusTimeline({ currentStatus }: { currentStatus: OrderStatus }) {
  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
          <X className="w-3 h-3 text-red-500" />
        </div>
        <span className="text-xs font-semibold text-red-600">Order Cancelled</span>
      </div>
    );
  }

  const currentIdx = STATUS_FLOW.indexOf(currentStatus);

  return (
    <div className="flex items-center w-full overflow-x-auto pb-1 mt-2">
      {STATUS_FLOW.map((step, idx) => {
        const isCompleted = idx < currentIdx;
        const isCurrent   = idx === currentIdx;

        return (
          <div key={step} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-pink-600 border-pink-600"
                    : isCurrent
                    ? "bg-white border-pink-600 shadow-[0_0_0_2px_rgba(219,39,119,0.15)]"
                    : "bg-white border-gray-200"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 text-white" />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-pink-600" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                )}
              </div>
              <span
                className={`text-[9px] font-semibold whitespace-nowrap ${
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

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder]     = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    document.title = "Track Order | GirlyHub";
  }, []);

  const handleTrackOrder = async () => {
    setOrder(null);
    setError("");
    if (!orderId) {
      setError("Please enter your Order ID.");
      return;
    }
    if (orderId.length !== 24) {
      setError("Please enter a valid Order ID.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.get(`/api/order/${orderId}`);
      setOrder(response.data.order);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError("Order not found. Please check your Order ID.");
      } else {
        setError("Something went wrong while fetching the order.");
      }
    } finally {
      setLoading(false);
      setOrderId("");
    }
  };

  const getProductTitle = (item: any) =>
    item.productId?.title || item.title || "Product";
  const getProductPrice = (item: any) =>
    item.price ?? item.productId?.discountPrice ?? item.productId?.discountedPrice ?? item.productId?.price ?? 0;
  const getProductImage = (item: any) =>
    item.productId?.image || item.image || "";

  // Legacy fallbacks for older orders missing these fields
  const subtotal = order?.subtotal ??
    (order?.products?.reduce((acc, item) => acc + getProductPrice(item) * (item.quantity ?? 1), 0) ?? 0);
  const shippingCharge = order?.shippingCharge ?? ((order?.totalAmount ?? 0) < 150 ? 80 : 0);
  const firstOrderDiscount = order?.firstOrderDiscount ?? 0;
  const couponDiscount = order?.couponDiscount ?? (
    order?.couponCode ? Math.max(0, subtotal + shippingCharge - firstOrderDiscount - (order?.totalAmount ?? 0)) : 0
  );
  return (
    <div className="min-h-[80vh] bg-rose-50/20 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Search Header */}
        <div className="bg-white rounded-2xl border border-rose-100 p-6 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4 justify-center">
            <BsBoxSeam className="text-pink-600 w-5 h-5" />
            Track Your Order
          </h1>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value.trim())}
              placeholder="Enter your 24-character Order ID (e.g. 66a91e...)"
              className="flex-1 px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all bg-white"
            />
            <button
              onClick={handleTrackOrder}
              disabled={loading}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="animate-spin" />
              ) : (
                <>
                  <FaSearch className="w-3.5 h-3.5" />
                  Track Order
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 text-xs font-medium text-red-600 flex items-center gap-1.5">
              <MdErrorOutline className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Order Details Display */}
        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden space-y-6 p-6">
            
            {/* Header info */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                <code className="text-sm font-mono font-bold text-pink-700">{order._id}</code>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status].bg} ${STATUS_COLORS[order.status].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[order.status].dot}`} />
                  {STATUS_LABELS[order.status]}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Status Timeline</p>
              <StatusTimeline currentStatus={order.status} />
            </div>

            {/* AWB details */}
            {order.awbNumber && (
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <div>
                    <span className="text-xs text-indigo-500 block">Tracking Number</span>
                    <span className="font-bold text-indigo-900 font-mono">{order.awbNumber}</span>
                  </div>
                </div>
                {order.trackingLink && (
                  <a
                    href={order.trackingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-lg transition-colors"
                  >
                    Track Live
                  </a>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Items Purchased</p>
              <div className="space-y-3">
                {order.products.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50/50 border border-gray-100 rounded-xl">
                    <img
                      src={getProductImage(item)}
                      alt={getProductTitle(item)}
                      className="w-14 h-16 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 line-clamp-1">{getProductTitle(item)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        ₹{getProductPrice(item)} × {item.quantity}
                        {item.size && (
                          <span className="ml-2 bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {item.size}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              
              {/* Receipt */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Pricing Details</p>
                <div className="rounded-xl border border-gray-100 overflow-hidden text-xs text-gray-600 bg-gray-50/30">
                  <div className="flex justify-between px-4 py-2 border-b border-gray-50">
                    <span>Items Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {shippingCharge > 0 && (
                    <div className="flex justify-between px-4 py-2 border-b border-gray-50">
                      <span>Delivery charge</span>
                      <span>₹{shippingCharge.toFixed(2)}</span>
                    </div>
                  )}
                  {firstOrderDiscount > 0 && (
                    <div className="flex justify-between px-4 py-2 border-b border-gray-50 text-green-600">
                      <span>First Order Discount</span>
                      <span>-₹{firstOrderDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between px-4 py-2 border-b border-gray-50 text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Coupon Discount
                        {order.couponCode && <code className="bg-green-100 text-green-700 px-1 rounded">{order.couponCode}</code>}
                      </span>
                      <span>-₹{couponDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between px-4 py-2.5 font-bold text-gray-800 bg-gray-50">
                    <span>Total Amount Paid</span>
                    <span className="text-pink-600 text-sm">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Delivery info */}
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Shipping Address</p>
                  <div className="text-xs text-gray-600 space-y-1 bg-gray-50/30 p-3 rounded-xl border border-gray-100">
                    <p className="font-bold text-gray-800">{order.recipientName || "Recipient"}</p>
                    <p>{order.address}{order.city ? `, ${order.city}` : ""}{order.state ? `, ${order.state}` : ""}</p>
                    {order.zip && <p>PIN: {order.zip}</p>}
                    {order.phone && <p>Phone: {order.phone}</p>}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
