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
};

type ProductCardProps = {
  product: ProductCardProduct;
  showActions?: boolean;
  showStock?: boolean;
  onRemove?: () => void;
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
  className = "",
}: ProductCardProps) {
  const { addToWishlist, user, fetchUserCart } = useAuthStore();
  const router = useRouter();
  const inStock = isProductInStock(product);
  const [addedText, setAddedText] = useState(false);

  // Slideshow state
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

  useEffect(() => {
    if (!isHovered || images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % images.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const handleMouseEnter = () => {
    setIsHovered(true);
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
      setAddedText(true);
      setTimeout(() => setAddedText(false), 2000);
    } catch (err: unknown) {
      console.error("Failed to add to cart from card:", err);
    }
  };

  const handleCardBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    goToProduct();
  };

  const allProductsOfWishlist = user?.wishlist?.[0]?.products || [];
  const alreadyInWishlist = allProductsOfWishlist.some(
    (item: WishlistItemFlexible) => {
      if (typeof item.productId === "string") {
        return item.productId === product._id;
      }
      return item.productId._id === product._id;
    },
  );

  const goToProduct = () =>
    router.push(productUrl(product.title, product._id, product.slug));

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-neutral-100 bg-white p-4 transition-all duration-300 hover:border-neutral-200 ${className}`}
    >
      {/* Image area with overlays */}
      <div
        className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-neutral-100/85 border border-neutral-100/50 cursor-pointer"
        onClick={goToProduct}
      >
        {/* Discount Badge on the top left */}
        {product.discountPercentage > 0 && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold text-rose-600 shadow-sm border border-neutral-100/50 uppercase tracking-wider">
            {Math.floor(product.discountPercentage)}% Off
          </div>
        )}

        {/* Wishlist/Close Button on the top right */}
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          {!onRemove && (
            <button
              type="button"
              aria-label="Add to wishlist"
              className="flex size-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-white active:scale-95 border border-neutral-100/50 transition-all"
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
                <Heart className="size-4 fill-red-500 text-red-500" />
              ) : (
                <Heart className="size-4 text-neutral-400 hover:text-neutral-600" />
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

        {/* Product image using cover fit */}
        <div className="size-full">
          <Image
            src={images[activeImageIndex] || "/placeholder.png"}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            priority
          />
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
      <div className="flex-1 flex flex-col">
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
          className={`mt-1 text-xs font-medium mb-2 ${
            inStock ? "text-green-600" : "text-rose-600"
          }`}
        >
          {inStock ? "In Stock" : "Out of Stock"}
        </p>
      )}

      {showActions &&
        (inStock ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCardAddToCart}
              className="w-full rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
            >
              {addedText ? "Added!" : "Add to Bag"}
            </button>
            <button
              type="button"
              onClick={handleCardBuyNow}
              className="w-full rounded-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300"
            >
              Buy Now
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled
            className="mt-2 w-full cursor-not-allowed rounded-full border border-neutral-100 bg-neutral-50 py-2 text-xs font-medium text-neutral-400 uppercase tracking-wide"
          >
            Out of stock
          </button>
        ))}
    </div>
  );
}
