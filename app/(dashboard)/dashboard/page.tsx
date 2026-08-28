"use client";
import { useEffect } from "react";
import { VscLoading } from "react-icons/vsc";
import {
  ArrowUpRight,
  Boxes,
  CircleAlert,
  ClipboardList,
  Layers3,
  Mail,
  Plus,
  ShoppingCart,
  Sparkles,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard";
import { useAuthStore } from "@/store/store";
import DashboardCharts from "@/components/OrdersChart";
import VisitorsChart from "@/components/VisitorsChart";

export default function DashboardHome() {
  const { user } = useAuthStore();
  const {
    users,
    orders,
    products,
    categories,
    queries,
    newsletters,

    usersLoading,
    ordersLoading,
    productsLoading,
    categoriesLoading,
    queriesLoading,
    newslettersLoading,

    fetchUsers,
    fetchOrders,
    fetchProducts,
    fetchCategories,
    fetchQueries,
    fetchNewsletters,
  } = useDashboardStore();

  // Modify your useEffect to stagger requests
  useEffect(() => {
    fetchUsers();
    fetchOrders();
    fetchNewsletters();
    fetchProducts();
    fetchCategories();
    fetchQueries();
  }, []);

  // Determine if any data is still loading
  const isAnyLoading =
    usersLoading ||
    ordersLoading ||
    productsLoading ||
    categoriesLoading ||
    queriesLoading ||
    newslettersLoading;

  const totalRevenue = orders.reduce(
    (acc, order) => acc + (order.totalAmount || 0),
    0,
  );
  const averageOrder = orders.length ? totalRevenue / orders.length : 0;
  const lowStockProducts = products.filter(
    (product) => product.countInStock <= 5,
  );
  const productsSold = products.reduce(
    (total, product) => total + (product.sold || 0),
    0,
  );
  const stats = [
    {
      label: "Net revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      detail: "Across all orders",
      icon: Sparkles,
      tone: "bg-[#eef7c9] text-[#526500]",
    },
    {
      label: "Orders",
      value: orders.length.toLocaleString(),
      detail: `₹${Math.round(averageOrder).toLocaleString()} average order`,
      icon: ShoppingCart,
      tone: "bg-[#e7f2ff] text-[#2464a8]",
    },
    {
      label: "Customers",
      value: users.length.toLocaleString(),
      detail: "Registered accounts",
      icon: Users,
      tone: "bg-[#fff0dc] text-[#9a5a14]",
    },
    {
      label: "Products",
      value: products.length.toLocaleString(),
      detail: `${lowStockProducts.length} need attention`,
      icon: Boxes,
      tone: "bg-pink-100 text-pink-700",
    },
    {
      label: "Products sold",
      value: productsSold.toLocaleString(),
      detail: "Units in completed orders",
      icon: ShoppingCart,
      tone: "bg-[#f3e8ff] text-[#7e22ce]",
    },
  ];

  if (isAnyLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <VscLoading className="animate-spin text-[#526500] text-3xl" />
      </div>
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#f4f5f7] px-4 pb-16 pt-20 text-[#17191c] md:px-8 md:pt-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/40">
              GirlyHub commerce operations
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Good morning, {user?.name?.split(" ")[0] || "Admin"}.
            </h1>
            <p className="mt-2 text-sm text-black/55">
              Here is what is happening across your store today.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-lg border border-black/15 bg-white px-4 py-2.5 text-sm font-medium hover:border-black/40"
            >
              View storefront
            </Link>
            <Link
              href="/addproduct"
              className="flex items-center gap-2 rounded-lg bg-[#17191c] px-4 py-2.5 text-sm font-medium text-white hover:bg-black"
            >
              <Plus className="size-4" /> Add product
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, value, detail, icon: Icon, tone }) => (
            <div
              key={label}
              className="rounded-xl border border-black/10 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-black/55">{label}</p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">
                    {value}
                  </p>
                </div>
                <div
                  className={`flex size-10 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-4 text-xs text-black/45">{detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <section className="min-w-0 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Revenue performance</h2>
                <p className="mt-1 text-xs text-black/45">
                  Order value across your store
                </p>
              </div>
              <span className="rounded-full bg-[#eef7c9] px-3 py-1 text-xs font-medium text-[#526500]">
                Live data
              </span>
            </div>
            <DashboardCharts />
          </section>
          <section className="min-w-0 rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Store traffic</h2>
                <p className="mt-1 text-xs text-black/45">
                  Visitors and conversion signals
                </p>
              </div>
              <ArrowUpRight className="size-5 text-black/35" />
            </div>
            <VisitorsChart />
          </section>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Recent orders</h2>
              <Link
                href="/orders"
                className="text-xs font-medium text-[#526500]"
              >
                View all <ArrowUpRight className="ml-1 inline size-3" />
              </Link>
            </div>
            {orders.length === 0 ? (
              <p className="py-8 text-center text-sm text-black/45">
                Orders will appear here once customers check out.
              </p>
            ) : (
              <div className="divide-y divide-black/8">
                {orders.slice(0, 5).map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        Order #{order._id.slice(-7).toUpperCase()}
                      </p>
                      <p className="mt-1 text-xs text-black/45">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <p className="text-sm font-semibold">
                      ₹{order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Needs attention</h2>
              <CircleAlert className="size-5 text-[#c47a1a]" />
            </div>
            <div className="space-y-2">
              {[
                {
                  label: "Low stock products",
                  value: lowStockProducts.length,
                  href: "/products",
                  icon: Boxes,
                },
                {
                  label: "Customer enquiries",
                  value: queries.length,
                  href: "/support",
                  icon: ClipboardList,
                },
                {
                  label: "Newsletter subscribers",
                  value: newsletters.length,
                  href: "/others",
                  icon: Mail,
                },
                {
                  label: "Product categories",
                  value: categories.length,
                  href: "/categories",
                  icon: Layers3,
                },
              ].map(({ label, value, href, icon: Icon }) => (
                <Link
                  href={href}
                  key={label}
                  className="flex items-center justify-between rounded-lg bg-[#f7f7f5] px-3 py-3 hover:bg-[#eef7c9]"
                >
                  <span className="flex items-center gap-3 text-sm">
                    <Icon className="size-4 text-black/45" />
                    {label}
                  </span>
                  <span className="text-sm font-semibold">{value}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
