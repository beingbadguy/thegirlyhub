"use client";

import { useAuthStore } from "@/store/store";
import { isProductInStock } from "@/lib/productStock";
import { productUrl } from "@/lib/slug";
import { Heart } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoCloseOutline } from "react-icons/io5";
import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";

export type ProductCardProduct = {
  _id: string;
  title: string;
  slug?: string;
  price: number;
  discountedPrice: number;
  discountPercentage: number;
  image: string;
  images?: string[];
  countInStock: number;
  isActive: boolean;
  category?: string;
  status?: string;
  stock?: number;
  totalStock?: number;
};

type ProductCardProps = {
  product: ProductCardProduct;
  showActions?: boolean;
  showStock?: boolean;
  onRemove?: () => void;
  onProductClick?: () => void;
  className?: string;
};

type WishlistItemFlexible = {
  productId: string | { _id: string };
};

export default function ProductCard({
  product,
  showActions = true,
  showStock = false,
  onRemove,
  onProductClick,
  className = "",
}: ProductCardProps) {
  const { addToWishlist, user, userWishlist, fetchUserCart } = useAuthStore();
  const router = useRouter();
  const inStock = isProductInStock(product);
  const [addedText, setAddedText] = useState(false);

  // Slideshow state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const rawImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.image || (product as any).mainImage || "/placeholder.png"];
  const images = rawImages.filter(Boolean);
  if (images.length === 0) images.push("/placeholder.png");

  useEffect(() => {
    if (!isHovered || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (images.length > 1) {
      setActiveImageIndex(1);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setActiveImageIndex(0);
  };

  const handleCardAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let defaultSize = "M";
      const cat = product.category || "";
      if (["Shoes", "Slippers", "shoes", "flats"].includes(cat)) {
        defaultSize = "7";
      } else if (
        !["Lowers", "Jeans", "Shirts", "dresses", "suits"].includes(cat)
      ) {
        defaultSize = "One Size";
      }

      await useAuthStore.getState().addToCart(product._id, defaultSize);
      useAuthStore.getState().openCart();
      setAddedText(true);
      setTimeout(() => setAddedText(false), 2000);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const handleCardBuyNow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let defaultSize = "M";
      const cat = product.category || "";
      if (["Shoes", "Slippers", "shoes", "flats"].includes(cat)) {
        defaultSize = "7";
      } else if (
        !["Lowers", "Jeans", "Shirts", "dresses", "suits"].includes(cat)
      ) {
        defaultSize = "One Size";
      }

      await useAuthStore.getState().addToCart(product._id, defaultSize);
      router.push("/checkout");
    } catch (error) {
      console.error("Failed to buy now:", error);
    }
  };

  const goToProduct = () => {
    onProductClick?.();
    router.push(productUrl(product.title, product._id, product.slug));
  };

  const allProductsOfWishlist =
    userWishlist?.products || user?.wishlist?.[0]?.products || [];
  const alreadyInWishlist = allProductsOfWishlist.some(
    (item: WishlistItemFlexible) => {
      const pId =
        (typeof item.productId === "object" && item.productId !== null
          ? item.productId._id || (item.productId as any).id
          : item.productId) || (item as any)._id;
      return pId === product._id;
    },
  );

  return (
    <div
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-neutral-100/80 shadow-xs hover:shadow-md transition-all duration-300 md:p-3 p-1.5 ${className}`}
    >
      {/* Image Container */}
      <div
        className="relative aspect-square w-full overflow-hidden rounded-xl bg-neutral-50 cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={goToProduct}
      >
        {/* Out of Stock or Discount Badge on the top left */}
        {!inStock ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-neutral-900/85 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white shadow-xs uppercase tracking-wider">
            Out of Stock
          </div>
        ) : product.discountPercentage > 0 ? (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold text-rose-600 shadow-sm border border-neutral-100/50 uppercase tracking-wider">
            {Math.floor(product.discountPercentage)}% Off
          </div>
        ) : null}

        {/* Wishlist/Close Button on the top right */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {!onRemove && (
            <button
              type="button"
              aria-label={
                user && alreadyInWishlist
                  ? "In wishlist"
                  : "Add to wishlist"
              }
              className={`group/heart flex size-8 items-center justify-center rounded-full bg-white shadow-md active:scale-95 border transition-all duration-200 cursor-pointer ${
                user && alreadyInWishlist
                  ? "border-rose-300 bg-rose-50/80 hover:bg-rose-100 shadow-rose-200/50"
                  : "border-neutral-100/80 hover:border-rose-300 hover:bg-rose-50/40 hover:scale-110"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (user) {
                  addToWishlist(product._id);
                } else {
                  router.push("/wishlist");
                }
              }}
            >
              {user && alreadyInWishlist ? (
                <Heart className="size-4 fill-rose-500 text-rose-500 transition-transform duration-200 group-hover/heart:scale-110" />
              ) : (
                <Heart className="size-4 text-neutral-400 group-hover/heart:text-rose-500 group-hover/heart:stroke-rose-500 transition-all duration-200" />
              )}
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              aria-label="Remove"
              className="flex size-8 items-center justify-center rounded-full bg-white text-rose-500 shadow-md hover:bg-rose-50"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <IoCloseOutline className="size-5" />
            </button>
          )}
        </div>

        {/* Product image using smooth crossfade */}
        <div className={`relative size-full overflow-hidden transition-opacity duration-300 ${!inStock ? "opacity-80 grayscale-[20%]" : ""}`}>
          {images.map((imgSrc, idx) => (
            <Image
              key={`${imgSrc}-${idx}`}
              src={imgSrc || "/placeholder.png"}
              alt={product.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                idx === activeImageIndex
                  ? "opacity-100 z-1"
                  : "opacity-0 z-0 pointer-events-none"
              }`}
              priority={idx === 0}
            />
          ))}
        </div>

        {/* Slideshow dots indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`size-1.5 rounded-full transition-all duration-300 ${
                  idx === activeImageIndex
                    ? "bg-rose-600 w-3"
                    : "bg-neutral-300/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col px-2 pb-3 md:px-0 md:pb-0">
        {product.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1 block">
            {product.category}
          </span>
        )}

        <h3
          className="line-clamp-2 cursor-pointer font-sans text-[13px] font-bold leading-tight text-neutral-800 transition-colors hover:text-rose-600"
          onClick={goToProduct}
        >
          {product.title}
        </h3>

        <div
          className="mt-1.5 flex cursor-pointer items-baseline gap-2 text-xs font-semibold mb-2"
          onClick={goToProduct}
        >
          <span className="text-neutral-900 font-bold text-sm">
            ₹{product.discountedPrice}
          </span>
          {product.price > product.discountedPrice && (
            <span className="text-neutral-400 line-through text-[10px]">
              ₹{product.price}
            </span>
          )}
        </div>
      </div>

      {showStock && (
        <p
          className={`mx-2 mt-1 mb-2 text-xs font-medium md:mx-0 ${
            inStock ? "text-green-600" : "text-rose-600"
          }`}
        >
          {inStock ? "In Stock" : "Out of Stock"}
        </p>
      )}

      {showActions &&
        (inStock ? (
          <div className="mx-2 mt-2 mb-3 grid grid-cols-2 gap-2 md:mx-0 md:mb-0">
            <button
              type="button"
              onClick={handleCardAddToCart}
              className="w-full rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
            >
              {addedText ? "Added!" : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={handleCardBuyNow}
              className="relative w-full overflow-hidden rounded-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent [animation:button-shine_1.8s_ease-in-out_infinite]"
              />
              Buy Now
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="mx-2 mt-2 mb-3 w-auto cursor-not-allowed rounded-full border border-neutral-100 bg-neutral-50 py-2 text-xs font-medium text-neutral-400 uppercase tracking-wide md:mx-0 md:mb-0"
          >
            Out of stock
          </button>
        ))}
    </div>
  );
}
