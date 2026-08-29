"use client";
import PaginationControls from "@/components/PaginationControls";
import ProductCard from "@/components/ProductCard";
import { useAuthStore } from "@/store/store";
import { useRouter } from "next/navigation";
import BreadcrumbHome from "@/components/BreadcrumbHome";
import axios, { AxiosError } from "axios";
import { VscCoffee } from "react-icons/vsc";
import { useEffect, useState } from "react";

const WishlistPage = () => {
  const router = useRouter();
  const { fetchUser, fetchUserWishlist, userWishlist } = useAuthStore();
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const handleRemoveFromWishlist = async (productId: string) => {
    try {
      await axios.delete(`/api/wishlist/${productId}`);
      fetchUser();
      fetchUserWishlist();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        console.error(error.response?.data);
      }
    }
  };

  const allProducts = userWishlist?.products || [];
  const totalItems = allProducts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const isWishlistEmpty = totalItems < 1;

  useEffect(() => {
    document.title = "My Wishlist | GirlyHub";
    fetchUserWishlist();
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

  return (
    <div className="min-h-[70vh] p-4">
      <div className="mb-4 text-sm text-gray-500 flex items-center gap-1.5 flex-wrap">
        <BreadcrumbHome />{" "}
        /{" "}
        <span
          className="cursor-pointer hover:text-pink-600"
          onClick={() => router.push("/product")}
        >
          Products
        </span>{" "}
        / <span className="text-black">Wishlist</span>
      </div>

      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-pink-700">Your Wishlist</h1>
        {totalItems > 0 && (
          <span className="text-sm text-gray-500">
            {totalItems} saved item{totalItems !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isWishlistEmpty && (
        <div className="my-2 flex flex-wrap items-center gap-1 text-sm text-gray-600">
          <VscCoffee className="animate-pulse" />
          Your wishlist is empty. Add some items to your wishlist!
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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

      {totalItems > 0 && (
        <p className="mt-4 text-center text-sm text-rose-900/50">
          Showing page {page} of {totalPages} ({totalItems} item{totalItems !== 1 ? "s" : ""} in wishlist)
        </p>
      )}
    </div>
  );
};

export default WishlistPage;
