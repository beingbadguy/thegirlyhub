"use client";

import { Suspense, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios, { AxiosError } from "axios";
import {
  User,
  Package,
  MapPin,
  Lock,
  Heart,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/store";
import { compressImage } from "@/utils/image";
import ProductCard from "@/components/ProductCard";
import PaginationControls from "@/components/PaginationControls";
import GuestAuthPrompt from "@/components/GuestAuthPrompt";
import FloralAccent from "@/components/decorations/FloralAccent";

// Enterprise Profile Components
import ProfileHeroHeader from "@/components/profile/ProfileHeroHeader";
import ProfileStatsCards from "@/components/profile/ProfileStatsCards";
import ProfilePersonalSection from "@/components/profile/ProfilePersonalSection";
import ProfileAddressBook from "@/components/profile/ProfileAddressBook";
import ProfileOrdersSection from "@/components/profile/ProfileOrdersSection";
import ProfileSecuritySection from "@/components/profile/ProfileSecuritySection";
import ProfileToast, { ToastMessage, ToastType } from "@/components/profile/ProfileToast";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";

import {
  ProfileMenuKey,
  OrderFilterKey,
  OrderSortKey,
  UserProfileData,
  StatusCounts,
} from "@/types/profile";

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Auth Store
  const {
    user: storeUser,
    logout,
    isLoggingOut,
    fetchUser,
    userWishlist,
    userCart,
    fetchUserCart,
    fetchUserWishlist,
  } = useAuthStore();

  // Query Parameters from URL
  const tabParam = (searchParams.get("tab") as ProfileMenuKey) || "account";
  const statusParam = (searchParams.get("status") as OrderFilterKey) || "all";
  const searchParam = searchParams.get("search") || "";
  const sortParam = (searchParams.get("sort") as OrderSortKey) || "newest";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);

  // Active States
  const [activeTab, setActiveTab] = useState<ProfileMenuKey>(tabParam);
  const [authChecked, setAuthChecked] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Orders Query States
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(pageParam || 1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [orderFilter, setOrderFilter] = useState<OrderFilterKey>(statusParam);
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [sortOrder, setSortOrder] = useState<OrderSortKey>(sortParam);
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    all: 0,
    processing: 0,
    reviewing: 0,
    preparing: 0,
    shipped: 0,
    delivered: 0,
    completed: 0,
    cancelled: 0,
  });

  // Cart & Wishlist Pages
  const [cartPage, setCartPage] = useState(1);
  const [wishlistPage, setWishlistPage] = useState(1);
  const itemsPerPage = 9;

  // Photo Upload State
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const showToast = (message: string, type: ToastType = "info", title?: string) => {
    setToast({
      id: `toast_${Date.now()}`,
      type,
      message,
      title,
    });
  };

  // URL Sync Helper
  const updateQueryParams = useCallback(
    (params: Record<string, string | number | null | undefined>) => {
      startTransition(() => {
        const next = new URLSearchParams(searchParams.toString());
        Object.entries(params).forEach(([key, val]) => {
          if (val === null || val === undefined || val === "") {
            next.delete(key);
          } else {
            next.set(key, String(val));
          }
        });
        router.replace(`/profile?${next.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  // Synchronize URL on tab change
  const handleSelectTab = (tab: ProfileMenuKey) => {
    setActiveTab(tab);
    updateQueryParams({ tab, page: 1 });
  };

  // Fetch Full User Profile Data
  const loadUserProfile = useCallback(async () => {
    try {
      const res = await axios.get("/api/user");
      if (res.data?.success && res.data?.user) {
        setProfileData(res.data.user);
      }
    } catch (err) {
      console.error("Failed to load user profile:", err);
    }
  }, []);

  // Fetch Orders Query with filters, search, sort, pagination
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await axios.get("/api/order", {
        params: {
          page: ordersPage,
          limit: 10,
          status: orderFilter !== "all" ? orderFilter : undefined,
          search: searchQuery.trim() || undefined,
          sort: sortOrder,
        },
      });

      if (res.data?.success) {
        setOrders(res.data.orders || []);
        if (res.data.pagination) {
          setOrdersTotalPages(res.data.pagination.totalPages || 1);
        }
        if (res.data.statusCounts) {
          setStatusCounts(res.data.statusCounts);
        }
      }
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        console.error("Failed to fetch orders:", err.response?.data);
      }
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage, orderFilter, searchQuery, sortOrder]);

  // Initial Auth & Data Load
  useEffect(() => {
    document.title = "My Account & Orders | GirlyHub";
    fetchUser()
      .then(() => {
        loadUserProfile();
      })
      .finally(() => {
        setAuthChecked(true);
      });
  }, [fetchUser, loadUserProfile]);

  // Fetch Orders whenever orders query params change
  useEffect(() => {
    if (storeUser?._id) {
      fetchOrders();
    }
  }, [storeUser?._id, fetchOrders]);

  // Sync state if URL query params change externally
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
    if (statusParam && statusParam !== orderFilter) {
      setOrderFilter(statusParam);
    }
    if (searchParam !== searchQuery) {
      setSearchQuery(searchParam);
    }
    if (sortParam !== sortOrder) {
      setSortOrder(sortParam);
    }
    if (pageParam && pageParam !== ordersPage) {
      setOrdersPage(pageParam);
    }
  }, [tabParam, statusParam, searchParam, sortParam, pageParam]);

  // Image Upload Handler with Instant Optimistic Preview
  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Profile image must be less than 5MB.", "error", "Image Too Large");
      return;
    }

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!validTypes.includes(file.type)) {
      showToast("Please select a JPG, PNG, WEBP or AVIF image.", "error", "Invalid Format");
      return;
    }

    // Instant local preview
    const previewUrl = URL.createObjectURL(file);
    const previousImage = profileData?.image;
    if (profileData) {
      setProfileData({ ...profileData, image: previewUrl });
    }

    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append("image", compressed);

      const res = await axios.put("/api/profileupload", formData);
      if (res.data?.success) {
        showToast("Your avatar has been updated!", "success", "Photo Uploaded");
        await Promise.all([fetchUser(), loadUserProfile()]);
      }
    } catch (err) {
      // Rollback on failure
      if (profileData) {
        setProfileData({ ...profileData, image: previousImage });
      }
      showToast("Could not upload profile photo. Please try again.", "error", "Upload Failed");
    } finally {
      URL.revokeObjectURL(previewUrl);
      setUploadingPhoto(false);
    }
  };

  // Cart & Wishlist Remove Handlers
  const handleRemoveFromCart = async (productId: string) => {
    try {
      await axios.delete(`/api/cart/${productId}`);
      await Promise.all([fetchUserCart(), fetchUser()]);
      showToast("Item removed from your cart.", "info");
    } catch (err) {
      showToast("Failed to remove item from cart.", "error");
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await axios.delete(`/api/wishlist/${productId}`);
      await Promise.all([fetchUserWishlist(), fetchUser()]);
      showToast("Item removed from your wishlist.", "info");
    } catch (err) {
      showToast("Failed to update wishlist.", "error");
    }
  };

  // Navigation Tabs Configuration
  const menuItems: { label: string; key: ProfileMenuKey; icon: React.ReactNode; badge?: number }[] = [
    {
      label: "Account Details",
      key: "account",
      icon: <User className="size-4" />,
    },
    {
      label: "Orders & Tracking",
      key: "orders",
      icon: <Package className="size-4" />,
      badge: statusCounts.all,
    },
    {
      label: "Saved Addresses",
      key: "addresses",
      icon: <MapPin className="size-4" />,
      badge: profileData?.addresses?.length || (profileData?.address ? 1 : 0),
    },
    {
      label: "Security & Login",
      key: "security",
      icon: <Lock className="size-4" />,
    },
    {
      label: "My Wishlist",
      key: "wishlist",
      icon: <Heart className="size-4" />,
      badge: userWishlist?.products?.length || 0,
    },
    {
      label: "Shopping Bag",
      key: "cart",
      icon: <ShoppingBag className="size-4" />,
      badge: (userCart?.products || []).filter((p) => p?.productId?._id).length,
    },
  ];

  // Combined User Data Object
  const mergedUser: UserProfileData = useMemo(() => {
    const raw = profileData || (storeUser as any) || {};
    return {
      _id: raw._id || "",
      id: raw._id || raw.id || "",
      name: raw.name || "Customer",
      email: raw.email || "",
      role: raw.role || "customer",
      authProvider: raw.authProvider || "local",
      image: raw.image || null,
      isVerified: Boolean(raw.isVerified),
      firstPurchase: Boolean(raw.firstPurchase),
      phone: raw.phone || null,
      address: raw.address || "",
      city: raw.city || "",
      state: raw.state || "",
      landmark: raw.landmark || null,
      zip: raw.zip || raw.postalCode || null,
      country: raw.country || "India",
      addresses: raw.addresses || [],
      ordersCount: statusCounts.all || raw.ordersCount || 0,
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt,
    };
  }, [profileData, storeUser, statusCounts.all]);

  // Wishlist & Cart Paginated Items
  const validCartItems = (userCart?.products || []).filter((item) => item?.productId?._id);
  const cartTotalPages = Math.ceil(validCartItems.length / itemsPerPage) || 1;
  const paginatedCart = validCartItems.slice(
    (cartPage - 1) * itemsPerPage,
    cartPage * itemsPerPage,
  );

  const wishlistProducts = userWishlist?.products || [];
  const wishlistTotalPages = Math.ceil(wishlistProducts.length / itemsPerPage) || 1;
  const paginatedWishlist = wishlistProducts.slice(
    (wishlistPage - 1) * itemsPerPage,
    wishlistPage * itemsPerPage,
  );

  // Loading Screen
  if (!authChecked) {
    return <ProfileSkeleton />;
  }

  // Guest Prompt if Not Logged In
  if (!storeUser) {
    return (
      <div className="bg-[#fdf7f9] min-h-[80vh] flex items-center justify-center py-12 px-4">
        <GuestAuthPrompt
          title="Sign in to your GirlyHub Profile"
          description="View active orders, track live parcels, save delivery addresses and access member-only discounts."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf7f9] pb-16 pt-4 sm:pt-6">
      {/* Toast Notification Container */}
      <ProfileToast toast={toast} onClose={() => setToast(null)} />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. Hero Executive Header */}
        <ProfileHeroHeader
          user={mergedUser}
          uploadingPhoto={uploadingPhoto}
          onImageChange={handleImageChange}
          isLoggingOut={isLoggingOut}
          onLogout={logout}
          onShowToast={showToast}
        />

        {/* 2. Key Metrics Bar */}
        <ProfileStatsCards
          ordersCount={statusCounts.all}
          addressesCount={mergedUser.addresses?.length || (mergedUser.address ? 1 : 0)}
          wishlistCount={wishlistProducts.length}
          cartCount={validCartItems.length}
          onSelectTab={handleSelectTab}
        />

        {/* 3. Main Dashboard Navigation & Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {/* Desktop Left Navigation Menu */}
          <aside className="hidden md:flex flex-col gap-1 rounded-3xl border border-rose-100/80 bg-white p-3.5 shadow-xs sticky top-24">
            <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-rose-900/60">
              Account Navigation
            </div>
            {menuItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelectTab(item.key)}
                  className={`flex items-center justify-between gap-3 rounded-2xl px-3.5 py-3 text-xs font-semibold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-rose-700 text-white shadow-xs"
                      : "text-stone-700 hover:bg-rose-50/70 hover:text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? "bg-white/25 text-white"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </aside>

          {/* Mobile Horizontal Scrollable Tab Bar */}
          <div className="md:hidden sticky top-0 z-30 -mx-4 px-4 py-2 bg-[#fdf7f9]/90 backdrop-blur-md border-b border-rose-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {menuItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelectTab(item.key)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-rose-700 text-white shadow-xs"
                      : "bg-white text-stone-700 border border-rose-100"
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content Panel (3 Columns) */}
          <main className="md:col-span-3 min-w-0">
            {/* TAB 1: Account Overview */}
            {activeTab === "account" && (
              <ProfilePersonalSection
                user={mergedUser}
                onRefreshUser={loadUserProfile}
                onSelectTab={handleSelectTab}
                onShowToast={showToast}
              />
            )}

            {/* TAB 2: Orders & Tracking */}
            {activeTab === "orders" && (
              <ProfileOrdersSection
                orders={orders}
                statusCounts={statusCounts}
                totalOrdersCount={statusCounts.all}
                isLoading={ordersLoading}
                orderFilter={orderFilter}
                onFilterChange={(newFilter) => {
                  setOrderFilter(newFilter);
                  setOrdersPage(1);
                  updateQueryParams({ status: newFilter, page: 1 });
                }}
                searchQuery={searchQuery}
                onSearchChange={(newSearch) => {
                  setSearchQuery(newSearch);
                  setOrdersPage(1);
                  updateQueryParams({ search: newSearch, page: 1 });
                }}
                sortOrder={sortOrder}
                onSortChange={(newSort) => {
                  setSortOrder(newSort);
                  setOrdersPage(1);
                  updateQueryParams({ sort: newSort, page: 1 });
                }}
                currentPage={ordersPage}
                totalPages={ordersTotalPages}
                onPageChange={(page) => {
                  setOrdersPage(page);
                  updateQueryParams({ page });
                  window.scrollTo({ top: 350, behavior: "smooth" });
                }}
                onRefreshOrders={fetchOrders}
              />
            )}

            {/* TAB 3: Address Book */}
            {activeTab === "addresses" && (
              <ProfileAddressBook
                user={mergedUser}
                onRefreshUser={loadUserProfile}
                onShowToast={showToast}
              />
            )}

            {/* TAB 4: Security & Credentials */}
            {activeTab === "security" && (
              <ProfileSecuritySection
                user={mergedUser}
                onShowToast={showToast}
              />
            )}

            {/* TAB 5: Wishlist */}
            {activeTab === "wishlist" && (
              <div className="rounded-3xl border border-rose-100/80 bg-white p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-rose-50 pb-4">
                  <div>
                    <h2 className="font-serif text-2xl font-medium text-rose-950">
                      My Wishlist ({wishlistProducts.length})
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Curated pieces and favorites saved for later
                    </p>
                  </div>
                  {wishlistProducts.length > 0 && (
                    <button
                      type="button"
                      onClick={() => router.push("/wishlist")}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-900 hover:underline cursor-pointer"
                    >
                      View Full Wishlist Page →
                    </button>
                  )}
                </div>

                {wishlistProducts.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-400 mb-3">
                      <Heart className="size-6" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-rose-950">
                      Your wishlist is empty
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs">
                      Explore trending beauty, lifestyle and accessories, and tap the heart icon to save items.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="mt-4 rounded-xl bg-rose-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-800 transition shadow-xs cursor-pointer"
                    >
                      Discover Trending Items
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
                      {paginatedWishlist.map((item: any) => (
                        <ProductCard
                          key={item.productId?._id || item._id}
                          product={item.productId}
                          onRemove={() =>
                            handleRemoveFromWishlist(item.productId?._id || item._id)
                          }
                        />
                      ))}
                    </div>
                    {wishlistTotalPages > 1 && (
                      <div className="pt-4 flex flex-col items-center gap-2">
                        <PaginationControls
                          page={wishlistPage}
                          totalPages={wishlistTotalPages}
                          onPageChange={setWishlistPage}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* TAB 6: Cart */}
            {activeTab === "cart" && (
              <div className="rounded-3xl border border-rose-100/80 bg-white p-5 sm:p-7 shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-rose-50 pb-4">
                  <div>
                    <h2 className="font-serif text-2xl font-medium text-rose-950">
                      Shopping Bag ({validCartItems.length})
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Reserved items ready for instant delivery checkout
                    </p>
                  </div>
                  {validCartItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => router.push("/cart")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-800 transition cursor-pointer shadow-xs"
                    >
                      <ShoppingBag className="size-3.5" />
                      Proceed to Checkout
                    </button>
                  )}
                </div>

                {validCartItems.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center">
                    <div className="flex size-14 items-center justify-center rounded-full bg-rose-50 text-rose-400 mb-3">
                      <ShoppingBag className="size-6" />
                    </div>
                    <h3 className="font-serif text-lg font-medium text-rose-950">
                      Your shopping bag is empty
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs">
                      Looking for inspiration? Browse our hand-picked styles and best sellers.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="mt-4 rounded-xl bg-rose-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-800 transition shadow-xs cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3">
                      {paginatedCart.map((item: any) => (
                        <ProductCard
                          key={item.productId?._id || item._id}
                          product={item.productId}
                          onRemove={() =>
                            handleRemoveFromCart(item.productId?._id || item._id)
                          }
                        />
                      ))}
                    </div>
                    {cartTotalPages > 1 && (
                      <div className="pt-4 flex flex-col items-center gap-2">
                        <PaginationControls
                          page={cartPage}
                          totalPages={cartTotalPages}
                          onPageChange={setCartPage}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
