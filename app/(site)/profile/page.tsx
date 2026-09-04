"use client";
import OrderDetailsCard from "@/components/OrderDetailsCart";
import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { formatAddressLines, hasSavedAddress } from "@/lib/address";
import { INDIAN_STATES } from "@/lib/orderValidation";
import { useAuthStore } from "@/store/store";
import axios, { AxiosError } from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { compressImage } from "@/utils/image";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  Heart,
  LogOut,
  MapPin,
  Package,
  Pencil,
  ShoppingBag,
  User,
} from "lucide-react";
import GuestAuthPrompt from "@/components/GuestAuthPrompt";

type Order = {
  _id: string;
  userId: { _id: string; name: string; email: string };
  products: {
    productId: {
      _id: string;
      title: string;
      price: number;
      category: string;
      image: string;
      discountedPrice: number;
    };
    quantity: number;
  }[];
  totalAmount: number;
  paymentMethod: "cod" | "online" | "credit/debit";
  deliveryType: "normal" | "fast";
  address: string;
  city?: string;
  state?: string;
  zip?: number;
  phone: string;
  status:
    | "processing"
    | "cancelled"
    | "completed"
    | "reviewing"
    | "preparing"
    | "shipped"
    | "delivered";
  createdAt: string;
  updatedAt: string;
};

type MenuKey = "account" | "address" | "orders" | "cart" | "wishlist";
type OrderStatus = Order["status"];
type OrderFilter = "all" | OrderStatus;

const ORDER_FILTERS: { key: OrderFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "reviewing", label: "Reviewing" },
  { key: "preparing", label: "Preparing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function ProfilePage() {
  const router = useRouter();
  const {
    user,
    logout,
    isLoggingOut,
    fetchUser,
    userWishlist,
    userCart,
    fetchUserCart,
    fetchUserWishlist,
  } = useAuthStore();
  const [menu, setMenu] = useState<MenuKey>("account");
  const [showModal, setShowModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [orderPage, setOrderPage] = useState(1);
  const [cartPage, setCartPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const itemsPerPage = 12;

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [landmark, setLandmark] = useState("");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");

  const fetchUserOrders = async () => {
    try {
      const response = await axios.get("/api/order", {
        params: { page: 1, limit: 100 },
      });
      setOrders(response.data.orders || []);
    } catch (err: unknown) {
      if (err instanceof AxiosError) console.error(err.response?.data);
    }
  };

  useEffect(() => {
    document.title = "My Profile | GirlyHub";
    fetchUser().finally(() => setAuthChecked(true));
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchUserOrders();
    fetchUserCart();
    fetchUserWishlist();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setAddress(user.address || "");
    setCity(user.city || "");
    setState(user.state || "");
    setLandmark(user.landmark || "");
    setZip(user.zip ? String(user.zip) : "");
    setPhone(user.phone ? String(user.phone) : "");
  }, [user]);

  const addressLines = useMemo(
    () =>
      formatAddressLines({
        address: user?.address,
        landmark: user?.landmark,
        city: user?.city,
        state: user?.state,
        zip: user?.zip,
      }),
    [user],
  );

  const addressComplete = hasSavedAddress({
    address: user?.address,
    city: user?.city,
    state: user?.state,
    zip: user?.zip,
  });

  const validCartItems = (userCart?.products || []).filter(
    (item) => item?.productId?._id,
  );
  const validCartCount = validCartItems.length;
  const wishlistCount = userWishlist?.products?.length || 0;
  const filteredOrders =
    orderFilter === "all"
      ? orders
      : orders.filter((order) => order.status === orderFilter);
  const orderCounts = orders.reduce<Record<string, number>>(
    (acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    },
    { all: orders.length },
  );

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      const compressedImage = await compressImage(file);
      formData.append("image", compressedImage);
      await axios.put("/api/profileupload", formData);
      await fetchUser();
    } catch (err: unknown) {
      if (err instanceof AxiosError) console.error(err.response?.data);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const saveAddress = async () => {
    if (!/^[6-9]\d{9}$/.test(phone.toString())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (address.trim().length < 10) {
      setError("Street address must be at least 10 characters.");
      return;
    }
    if (city.trim().length < 2) {
      setError("City is required.");
      return;
    }
    if (!state) {
      setError("Please select a state.");
      return;
    }
    if (!/^\d{6}$/.test(String(zip))) {
      setError("Pincode must be exactly 6 digits.");
      return;
    }

    setIsUpdating(true);
    try {
      await axios.put("/api/user", {
        address: address.trim(),
        city: city.trim(),
        state,
        landmark: landmark.trim(),
        phone,
        zip,
      });
      await fetchUser();
      setError("");
      setShowModal(false);
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || "Could not update address.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    await axios.delete(`/api/cart/${productId}`);
    fetchUserCart();
    fetchUser();
  };

  const removeFromWishlist = async (productId: string) => {
    await axios.delete(`/api/wishlist/${productId}`);
    fetchUserWishlist();
    fetchUser();
  };

  const menuItems: { label: string; key: MenuKey; icon: React.ReactNode }[] = [
    { label: "Account", key: "account", icon: <User className="size-4" /> },
    { label: "Address", key: "address", icon: <MapPin className="size-4" /> },
    { label: "Orders", key: "orders", icon: <Package className="size-4" /> },
    { label: "Cart", key: "cart", icon: <ShoppingBag className="size-4" /> },
    { label: "Wishlist", key: "wishlist", icon: <Heart className="size-4" /> },
  ];

  if (!authChecked) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <AiOutlineLoading3Quarters className="animate-spin text-2xl text-rose-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <GuestAuthPrompt
        title="Your profile is private"
        description="Please log in to manage your account, track orders, and keep your GirlyHub details up to date."
      />
    );
  }

  return (
    <div className="bg-[#fdf7f9]">
      <div className="mx-auto flex max-w-7xl flex-col px-4 py-4 md:h-[calc(100dvh-5.5rem)] md:flex-row md:gap-6 md:overflow-hidden md:py-6">
        <aside className="hidden h-full w-64 shrink-0 flex-col overflow-y-auto rounded-2xl border border-rose-100 bg-white p-4 shadow-sm md:flex">
          <div className="mb-4 flex items-center gap-3 border-b border-rose-50 pb-4">
            <div className="relative size-12 overflow-hidden rounded-full bg-rose-50">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center font-serif text-lg text-rose-700">
                  {user.name?.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-rose-950">
                {user.name}
              </p>
              <p className="truncate text-xs text-rose-900/55">{user.email}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMenu(item.key)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  menu === item.key
                    ? "bg-rose-700 text-white"
                    : "text-rose-900/70 hover:bg-rose-50"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="sticky top-0 z-30 mb-3 rounded-2xl border border-rose-100 bg-white p-3 shadow-sm md:hidden">
          <div className="mb-3 flex items-center gap-3">
            <div className="relative size-11 overflow-hidden rounded-full bg-rose-50">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <span className="flex size-full items-center justify-center font-serif text-rose-700">
                  {user.name?.charAt(0)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-rose-950">
                {user.name}
              </p>
              <p className="truncate text-xs text-rose-900/55">{user.email}</p>
            </div>
          </div>
          <nav className="grid grid-cols-5 gap-1">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setMenu(item.key)}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-[11px] font-medium ${
                  menu === item.key
                    ? "bg-rose-700 text-white"
                    : "bg-rose-50 text-rose-800"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <section className="min-w-0 flex-1 md:h-full md:overflow-y-auto md:pb-2">
          {menu === "account" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative size-20 overflow-hidden rounded-full border border-rose-100 bg-rose-50">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex size-full items-center justify-center font-serif text-3xl text-rose-700">
                          {user.name?.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h1 className="font-serif text-2xl text-rose-950">
                        {user.name}
                      </h1>
                      <p className="text-sm text-rose-900/60">{user.email}</p>
                      <p className="mt-1 text-xs text-rose-900/50">
                        Member since{" "}
                        {new Date(user.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-rose-200 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">
                    {uploadingPhoto ? "Uploading…" : "Change photo"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Orders", value: orders.length },
                  { label: "Cart items", value: validCartCount },
                  { label: "Wishlist", value: wishlistCount },
                  {
                    label: "First order",
                    value: user.firstPurchase ? "Completed" : "Pending",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm"
                  >
                    <p className="text-xs uppercase tracking-wide text-rose-400">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-rose-950">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 font-serif text-xl text-rose-950">
                    Contact
                  </h2>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="text-rose-400">Email</dt>
                      <dd className="mt-0.5 text-rose-950">{user.email}</dd>
                    </div>
                    <div>
                      <dt className="text-rose-400">Phone</dt>
                      <dd className="mt-0.5 text-rose-950">
                        {user.phone || "Not added"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-rose-400">Account status</dt>
                      <dd className="mt-0.5 text-rose-950">
                        {user.isVerified ? "Verified" : "Pending verification"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-rose-400">First-order discount</dt>
                      <dd className="mt-0.5 text-rose-950">
                        {user.firstPurchase
                          ? "Already used on a previous order"
                          : "15% off is available on your first order"}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl text-rose-950">
                      Default address
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setMenu("address");
                        setShowModal(true);
                      }}
                      className="inline-flex items-center gap-1 text-sm font-medium text-rose-700 hover:underline"
                    >
                      <Pencil className="size-3.5" />
                      Edit
                    </button>
                  </div>
                  {addressLines.length > 0 ? (
                    <div className="space-y-1 text-sm leading-6 text-rose-950">
                      {addressLines.map((line, index) => (
                        <p key={`${line}-${index}`}>{line}</p>
                      ))}
                      {!addressComplete && (
                        <p className="pt-2 text-xs text-amber-700">
                          Add city and state so this address is complete for
                          checkout.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-rose-900/60">
                      Add a full delivery address so checkout can fill it in
                      automatically.
                    </p>
                  )}
                </div>
              </div>

              <Button
                className="w-full rounded-full bg-rose-950 text-white hover:bg-rose-900 sm:w-auto"
                disabled={isLoggingOut}
                onClick={logout}
              >
                {isLoggingOut ? (
                  <AiOutlineLoading3Quarters className="animate-spin" />
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <LogOut className="size-4" />
                    Logout
                  </span>
                )}
              </Button>
            </div>
          )}

          {menu === "address" && (
            <div className="rounded-2xl border border-rose-100 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="font-serif text-2xl text-rose-950">
                    Delivery address
                  </h1>
                  <p className="mt-1 text-sm text-rose-900/60">
                    This address is saved to your account and used at checkout.
                    Updating it here or while placing an order keeps it in sync.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-700 px-4 py-2 text-sm font-medium text-white hover:bg-rose-800"
                >
                  <Pencil className="size-3.5" />
                  {addressComplete ? "Edit" : "Add address"}
                </button>
              </div>

              {addressLines.length > 0 ? (
                <div className="rounded-xl border border-rose-100 bg-[#fff9fa] p-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400">
                    Saved address
                  </p>
                  <div className="space-y-1 text-sm leading-6 text-rose-950">
                    {addressLines.map((line, index) => (
                      <p key={`${line}-${index}`}>{line}</p>
                    ))}
                  </div>
                  {user.phone && (
                    <p className="mt-3 text-sm text-rose-900/70">
                      Phone: {user.phone}
                    </p>
                  )}
                  {!addressComplete && (
                    <p className="mt-3 text-xs text-amber-700">
                      City and state are missing. Edit this address so checkout
                      can use it fully.
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-rose-200 bg-[#fff9fa] p-8 text-center">
                  <MapPin className="mx-auto size-8 text-rose-300" />
                  <p className="mt-3 font-medium text-rose-950">
                    No complete address yet
                  </p>
                  <p className="mt-1 text-sm text-rose-900/60">
                    Add street, city, state and pincode so it appears here and
                    at checkout.
                  </p>
                </div>
              )}
            </div>
          )}

          {menu === "orders" &&
            (() => {
              const orderTotalPages =
                Math.ceil(filteredOrders.length / itemsPerPage) || 1;
              const paginatedOrders = filteredOrders.slice(
                (orderPage - 1) * itemsPerPage,
                orderPage * itemsPerPage,
              );

              return (
                <div className="rounded-2xl border border-rose-100 bg-white p-4 shadow-sm sm:p-5">
                  <h1 className="mb-4 font-serif text-2xl text-rose-950">
                    Orders ({orders.length})
                  </h1>
                  <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                    {ORDER_FILTERS.map((filter) => {
                      const count =
                        filter.key === "all"
                          ? orders.length
                          : orderCounts[filter.key] || 0;
                      return (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => {
                            setOrderFilter(filter.key);
                            setOrderPage(1);
                          }}
                          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
                            orderFilter === filter.key
                              ? "bg-rose-700 text-white"
                              : "bg-rose-50 text-rose-800 hover:bg-rose-100"
                          }`}
                        >
                          {filter.label} ({count})
                        </button>
                      );
                    })}
                  </div>
                  {orders.length === 0 ? (
                    <p className="text-sm text-rose-900/60">
                      You have not placed any orders yet.
                    </p>
                  ) : filteredOrders.length === 0 ? (
                    <p className="text-sm text-rose-900/60">
                      No {orderFilter} orders.
                    </p>
                  ) : (
                    <div>
                      {paginatedOrders.map((order) => (
                        <OrderDetailsCard
                          order={order as never}
                          key={order._id}
                          fetchUserOrders={fetchUserOrders}
                        />
                      ))}
                      <PaginationControls
                        page={orderPage}
                        totalPages={orderTotalPages}
                        onPageChange={setOrderPage}
                      />
                      {filteredOrders.length > itemsPerPage && (
                        <p className="mt-3 text-center text-xs text-rose-900/50">
                          Showing page {orderPage} of {orderTotalPages} (
                          {filteredOrders.length} orders)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

          {menu === "cart" &&
            (() => {
              const cartTotalPages =
                Math.ceil(validCartCount / itemsPerPage) || 1;
              const paginatedCart = validCartItems.slice(
                (cartPage - 1) * itemsPerPage,
                cartPage * itemsPerPage,
              );

              return (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h1 className="font-serif text-2xl text-rose-950">
                      Cart ({validCartCount})
                    </h1>
                    {validCartCount > 0 && (
                      <button
                        type="button"
                        onClick={() => router.push("/cart")}
                        className="text-sm font-medium text-rose-700 hover:underline"
                      >
                        Go to cart
                      </button>
                    )}
                  </div>
                  {validCartCount === 0 ? (
                    <p className="rounded-2xl border border-rose-100 bg-white p-8 text-sm text-rose-900/60">
                      Your cart is empty.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {paginatedCart.map((item) => (
                          <ProductCard
                            key={item.productId._id}
                            product={item.productId}
                            onRemove={() => removeFromCart(item.productId._id)}
                          />
                        ))}
                      </div>
                      <PaginationControls
                        page={cartPage}
                        totalPages={cartTotalPages}
                        onPageChange={setCartPage}
                      />
                      {validCartCount > itemsPerPage && (
                        <p className="mt-3 text-center text-xs text-rose-900/50">
                          Showing page {cartPage} of {cartTotalPages} (
                          {validCartCount} items)
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

          {menu === "wishlist" &&
            (() => {
              const wishlistTotalPages =
                Math.ceil(wishlistCount / itemsPerPage) || 1;
              const paginatedWishlist = (userWishlist?.products || []).slice(
                (wishlistPage - 1) * itemsPerPage,
                wishlistPage * itemsPerPage,
              );

              return (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h1 className="font-serif text-2xl text-rose-950">
                      Wishlist ({wishlistCount})
                    </h1>
                    {wishlistCount > 0 && (
                      <button
                        type="button"
                        onClick={() => router.push("/wishlist")}
                        className="text-sm font-medium text-rose-700 hover:underline"
                      >
                        Open wishlist
                      </button>
                    )}
                  </div>
                  {wishlistCount === 0 ? (
                    <p className="rounded-2xl border border-rose-100 bg-white p-8 text-sm text-rose-900/60">
                      Your wishlist is empty.
                    </p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {paginatedWishlist.map((item) => (
                          <ProductCard
                            key={item.productId._id}
                            product={item.productId}
                            onRemove={() =>
                              removeFromWishlist(item.productId._id)
                            }
                          />
                        ))}
                      </div>
                      <PaginationControls
                        page={wishlistPage}
                        totalPages={wishlistTotalPages}
                        onPageChange={setWishlistPage}
                      />
                      {wishlistCount > itemsPerPage && (
                        <p className="mt-3 text-center text-xs text-rose-900/50">
                          Showing page {wishlistPage} of {wishlistTotalPages} (
                          {wishlistCount} items)
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })()}
        </section>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-serif text-xl text-rose-950">
              {addressComplete ? "Edit address" : "Add address"}
            </h2>
            <p className="mt-1 text-sm text-rose-900/60">
              This updates your saved profile address everywhere, including
              checkout.
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Street address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="min-h-20 w-full rounded-lg border px-3 py-2 outline-none focus:border-rose-400"
                  placeholder="House no., street, area"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Landmark (optional)
                </label>
                <input
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 outline-none focus:border-rose-400"
                  placeholder="Near metro, mall, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-rose-400"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    State
                  </label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-rose-400"
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Pincode
                  </label>
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-rose-400"
                    placeholder="6-digit PIN"
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Phone
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 outline-none focus:border-rose-400"
                    placeholder="10-digit mobile"
                    maxLength={10}
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowModal(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                className="rounded-full bg-rose-700 text-white hover:bg-rose-800"
                onClick={saveAddress}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <AiOutlineLoading3Quarters className="animate-spin" />
                ) : (
                  "Save address"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
