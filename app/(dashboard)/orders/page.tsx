"use client";
import PaginationControls from "@/components/PaginationControls";
import { useAuthStore } from "@/store/store";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type Order = {
  _id: string;
  userId: { name: string; email: string };
  address: string;
  phone: string;
  deliveryType: string;
  paymentMethod: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  zip: string;
  products: {
    productId: {
      title: string;
      price: number;
      image: string;
    };
    quantity: number;
    _id: string;
    size: string;
  }[];
};

export default function AdminOrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const statuses = [
    "processing",
    "reviewing",
    "preparing",
    "shipped",
    "delivered",
    "completed",
    "cancelled",
  ];

  const fetchOrders = async (requestedPage = page) => {
    try {
      const res = await axios.get("/api/orders", {
        params: { page: requestedPage, limit: 12 },
      });
      setOrders(res.data.orders || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalOrders(res.data.pagination?.total || 0);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      } else {
        console.error("Error fetching orders:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await axios.put(`/api/orders/${id}`, { status });
      // console.log(response.data);

      fetchOrders();
      // setOrders((prev) =>
      //   prev.map((order) => (order._id === id ? { ...order, status } : order))
      // );
    } catch (error) {
      if (error instanceof AxiosError) {
        alert(error.response?.data?.message || "Failed to update status");
      } else {
        alert("Failed to update status");
      }
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (!user) {
      router.push("/login");
    }
  }, []);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AiOutlineLoading3Quarters className="animate-spin text-3xl text-pink-600" />
      </div>
    );

  return (
    <div className="mt-2 overflow-y-scroll max-h-[90vh] pt-20 pb-20 md:pt-0 md:mb-0 md:px-4">
      <h1 className="text-xl ml-2 md:text-2xl font-semibold mb-4 text-pink-700">
        All Orders ({orders?.length})
      </h1>
      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order._id}
            className="border rounded-xl p-4 shadow-sm bg-white"
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <h2 className="text-sm my-2 md:text-lg font-medium text-pink-700">
                  Order ID: {order._id}
                </h2>
                <p className="text-sm text-gray-600">
                  Placed on: {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  By: {order.userId.name} ({order.userId.email})
                </p>
                <p className="text-sm">
                  Phone: {order.phone || "Pincode Unavailable"}
                </p>
                <p className="text-sm">Address: {order.address}</p>
                {order.zip && <p className="text-sm">Pincode: {order.zip}</p>}
                <p className="text-sm">Delivery Type: {order.deliveryType}</p>
                <p className="text-sm">Payment Method: {order.paymentMethod}</p>
              </div>
              <div>
                <label className="text-sm mr-2">Status:</label>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                  disabled={updatingId === order._id}
                  className="border px-3 py-1 rounded-md cursor-pointer"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {order.products.map((item, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <img
                    src={item.productId.image}
                    alt={item.productId.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{item.productId.title}</p>
                    <p className="text-sm text-gray-500">
                      ₹{item.productId.price} × {item.quantity}
                    </p>
                    {item.size && (
                      <p className="text-sm text-gray-500 italic">
                        Size: {item.size}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right mt-4 font-semibold">
              Total: ₹{order.totalAmount}
            </div>
          </div>
        ))}
      </div>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={(nextPage) => {
          setPage(nextPage);
          fetchOrders(nextPage);
        }}
      />

      {totalOrders > 0 && (
        <p className="mt-3 text-center text-sm text-gray-500">
          Showing page {page} of {totalPages} ({totalOrders} orders)
        </p>
      )}
    </div>
  );
}
