"use client";
import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import FloralAccent from "@/components/decorations/FloralAccent";
import GuestAuthPrompt from "@/components/GuestAuthPrompt";
import { Heart, Sparkles } from "lucide-react";

function WishlistSkeleton() {
  return (
    <div className="min-h-[70vh] bg-[#fffafb] relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 relative z-10">
        {/* Breadcrumb Skeleton */}
        <nav className="mb-4 flex items-center gap-2">
          <div className="h-4 w-16 rounded-md bg-rose-100/70 animate-pulse" />
          <span className="text-neutral-300">/</span>
          <div className="h-4 w-20 rounded-md bg-rose-100/70 animate-pulse" />
          <span className="text-neutral-300">/</span>
          <div className="h-4 w-16 rounded-md bg-rose-200/80 animate-pulse" />
        </nav>

        {/* Header Skeleton */}
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-rose-100/70 pb-4">
          <div className="flex items-center gap-3">
            <FloralAccent flower={1} size="sm" animation="pulse" />
            <div className="h-8 w-44 rounded-xl bg-gradient-to-r from-pink-200/70 to-rose-200/50 animate-pulse" />
          </div>
          <div className="h-7 w-28 rounded-full bg-rose-100/80 animate-pulse self-start sm:self-auto" />
        </div>

        {/* Loading subtle notice banner */}
        <div className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-rose-50/60 border border-rose-100/80 py-2.5 px-4 text-xs font-medium text-rose-700">
          <Sparkles className="size-3.5 animate-spin text-rose-500" />
          <span>Fetching your saved wishlist items...</span>
        </div>

        {/* Product Cards Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div
              key={item}
              className="flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-neutral-100 p-2 md:p-3 shadow-xs animate-pulse"
            >
              {/* Image Box Skeleton with Heart button */}
              <div className="relative aspect-square w-full rounded-xl bg-gradient-to-br from-rose-50 via-rose-100/40 to-neutral-100 overflow-hidden">
                <div className="absolute top-2.5 right-2.5 size-7 rounded-full bg-white/90 shadow-xs flex items-center justify-center">
                  <Heart className="size-3.5 text-rose-300 fill-rose-100" />
                </div>
                <div className="absolute top-2.5 left-2.5 h-4 w-12 rounded-full bg-rose-200/60" />
              </div>

              {/* Text Info Skeleton */}
              <div className="mt-3 space-y-2">
                <div className="h-3.5 w-3/4 rounded-md bg-neutral-200/80" />
                <div className="h-3 w-1/2 rounded-md bg-neutral-100" />
                <div className="flex items-center justify-between pt-1">
                  <div className="h-4 w-16 rounded-md bg-rose-200/70" />
                  <div className="h-3 w-10 rounded-md bg-neutral-200/60" />
                </div>
              </div>

              {/* Action Button Skeleton */}
              <div className="mt-3 h-8 w-full rounded-xl bg-rose-100/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const WishlistPage = () => {
  const router = useRouter();
  const { user, fetchUser, fetchUserWishlist, userWishlist } = useAuthStore();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 12;

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await axios.delete(`/api/wishlist/${productId}`);
      await Promise.all([fetchUser(), fetchUserWishlist()]);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
    }
  };

  const allProducts = (userWishlist?.products || []).filter(
    (item) =>
      item?.productId && (item.productId._id || (item.productId as any).id)
  );
  const totalItems = allProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const isWishlistEmpty = totalItems < 1;

  useEffect(() => {
    document.title = "My Wishlist | GirlyHub";
    let isMounted = true;
    (async () => {
      try {
        await Promise.all([fetchUser(), fetchUserWishlist()]);
      } catch (err) {
        console.error("Failed to load user wishlist:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const paginatedProducts = allProducts.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  if (loading) {
    return <WishlistSkeleton />;
  }

  if (!user) {
    return (
      <GuestAuthPrompt
        title="Your wishlist is waiting"
        description="Please log in to save your favorite pieces and find them here whenever inspiration strikes."
      />
    );
  }

  return (
    <div className="min-h-[70vh] bg-[#fffafb] relative overflow-hidden">
      {/* Background floral flourishes */}
      <div className="pointer-events-none absolute right-[-40px] top-12 hidden opacity-25 lg:block select-none">
        <FloralAccent flower={1} size="xl" animation="float" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 relative z-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <Link
            href="/product"
            className="hover:text-rose-600 transition-colors"
          >
            Products
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900">Wishlist</span>
        </nav>

        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-rose-100/70 pb-4">
          <div className="flex items-center gap-3">
            <FloralAccent flower={1} size="sm" animation="pulse" />
            <h1 className="text-2xl md:text-3xl font-bold text-pink-700 font-serif">
              Your Wishlist
            </h1>
          </div>
          {totalItems > 0 && (
            <span className="text-sm font-medium text-rose-800 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 self-start sm:self-auto">
              {totalItems} saved item{totalItems !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isWishlistEmpty ? (
          <div className="my-10 flex flex-col items-center justify-center text-center p-8 bg-white rounded-3xl border border-rose-100 shadow-xs max-w-md mx-auto relative overflow-hidden">
            <div className="relative mb-4">
              <FloralAccent flower={2} size="lg" animation="float" />
              <div className="absolute -top-2 -right-2">
                <FloralAccent flower={1} size="xs" animation="pulse" />
              </div>
            </div>
            <h2 className="font-serif text-xl font-semibold text-rose-950 mb-1">
              Your Wishlist is Empty
            </h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              Save pieces you love by clicking the heart icon on any product!
            </p>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-medium text-sm shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
            >
              Explore Collections ✨
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {paginatedProducts.map((item) => (
                <ProductCard
                  key={item.productId._id}
                  product={{
                    _id: item.productId._id,
                    title: item.productId.title,
                    price: item.productId.price,
                    discountedPrice: item.productId.discountedPrice,
                    discountPercentage: item.productId.discountPercentage,
                    image: item.productId.image,
                    countInStock: item.productId.countInStock,
                    isActive: item.productId.isActive,
                    category: item.productId.category,
                    status: (item.productId as any).status,
                  }}
                  onRemove={() => handleRemoveFromWishlist(item.productId._id)}
                />
              ))}
            </div>

            <PaginationControls
              page={page}
              totalPages={totalPages}
              onPageChange={(nextPage) => {
                setPage(nextPage);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            <p className="mt-4 text-center text-sm text-rose-900/50">
              Showing page {page} of {totalPages} ({totalItems} item
              {totalItems !== 1 ? "s" : ""} in wishlist)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
