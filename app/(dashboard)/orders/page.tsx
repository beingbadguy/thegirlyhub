"use client";
import OrderDetailsCard from "@/components/OrderDetailsCart";
import PaginationControls from "@/components/PaginationControls";
import { useAuthStore } from "@/store/store";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { Package, Search, SlidersHorizontal } from "lucide-react";

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
  userId: { name: string; email: string };
  address: string;
  city?: string;
  state?: string;
  phone: string;
  deliveryType: string;
  paymentMethod: string;
  totalAmount: number;
  status: OrderStatus;
  awbNumber?: string;
  trackingLink?: string;
  statusHistory?: { status: OrderStatus; changedAt: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
  zip?: string;
  email?: string;
  recipientName?: string;
  products: {
    productId: { title: string; price: number; image: string };
    quantity: number;
    _id: string;
    size: string;
    title?: string;
    price?: number;
    image?: string;
  }[];
};

const STATUS_FILTER_OPTIONS: { label: string; value: string; color: string }[] = [
  { label: "All",        value: "all",        color: "bg-gray-100 text-gray-600"    },
  { label: "Processing", value: "processing", color: "bg-amber-100 text-amber-700"  },
  { label: "Reviewing",  value: "reviewing",  color: "bg-blue-100 text-blue-700"    },
  { label: "Preparing",  value: "preparing",  color: "bg-purple-100 text-purple-700"},
  { label: "Shipped",    value: "shipped",    color: "bg-indigo-100 text-indigo-700"},
  { label: "Delivered",  value: "delivered",  color: "bg-teal-100 text-teal-700"    },
  { label: "Completed",  value: "completed",  color: "bg-green-100 text-green-700"  },
  { label: "Cancelled",  value: "cancelled",  color: "bg-red-100 text-red-700"      },
];

export default function AdminOrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [orders, setOrders]           = useState<Order[]>([]);
  const [filtered, setFiltered]       = useState<Order[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  /* ── Fetch ── */
  const fetchOrders = async (requestedPage = page) => {
    try {
      const res = await axios.get("/api/orders", {
        params: { page: requestedPage, limit: 12 },
      });
      const data: Order[] = res.data.orders || [];
      setOrders(data);
      setFiltered(data);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalOrders(res.data.pagination?.total || 0);
    } catch (error: unknown) {
      if (error instanceof AxiosError) console.error(error.response?.data);
      else console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ── Client-side filtering (search + status) ── */
  useEffect(() => {
    let result = [...orders];

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o._id.toLowerCase().includes(q) ||
          o.userId?.name?.toLowerCase().includes(q) ||
          o.userId?.email?.toLowerCase().includes(q) ||
          o.phone?.includes(q)
      );
    }

    setFiltered(result);
  }, [search, statusFilter, orders]);

  useEffect(() => {
    if (!user) router.push("/login");
    fetchOrders();
  }, []);

  /* ── Stats ── */
  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <AiOutlineLoading3Quarters className="animate-spin text-3xl text-pink-600" />
          <p className="text-sm text-gray-500">Loading orders…</p>
        </div>
      </div>
    );

  return (
    <div className="mt-2 overflow-y-scroll max-h-[90vh] pt-20 pb-20 md:pt-6 md:mb-0 md:px-4">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-pink-600" />
            Orders
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalOrders} total orders · Page {page} of {totalPages}
          </p>
        </div>
      </div>

      {/* ── Stat Pills ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_FILTER_OPTIONS.filter((f) => f.value !== "all").map((f) =>
          statusCounts[f.value] ? (
            <span
              key={f.value}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${f.color} cursor-pointer select-none transition-all hover:scale-105`}
              onClick={() =>
                setStatusFilter((prev) => (prev === f.value ? "all" : f.value))
              }
            >
              {f.label}
              <span className="font-bold">{statusCounts[f.value]}</span>
            </span>
          ) : null
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID, name, email or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all bg-white"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all bg-white appearance-none cursor-pointer"
          >
            {STATUS_FILTER_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Order List ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No orders found</p>
          <p className="text-sm text-gray-400 mt-1">
            {search || statusFilter !== "all"
              ? "Try adjusting your search or filter."
              : "Orders will appear here once placed."}
          </p>
          {(search || statusFilter !== "all") && (
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="mt-4 px-4 py-2 text-sm rounded-xl bg-pink-50 text-pink-600 font-medium hover:bg-pink-100 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => (
            <OrderDetailsCard
              key={order._id}
              order={order as any}
              fetchUserOrders={() => fetchOrders(page)}
              isAdmin={true}
            />
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mt-8">
          <PaginationControls
            page={page}
            totalPages={totalPages}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              fetchOrders(nextPage);
            }}
          />
          <p className="mt-3 text-center text-sm text-gray-400">
            Showing page {page} of {totalPages} ({totalOrders} orders total)
          </p>
        </div>
      )}
    </div>
  );
}
