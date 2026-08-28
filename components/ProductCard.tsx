"use client";

import { useAuthStore } from "@/store/store";
import { isProductInStock } from "@/lib/productStock";
import { productUrl } from "@/lib/slug";
import { CiDiscount1 } from "react-icons/ci";
import { Heart, X, ShoppingCart, Star, Check } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { IoCloseOutline } from "react-icons/io5";
import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export type ProductCardProduct = {
  _id: string;
  title: string;
  slug?: string;
  price: number;
  discountedPrice: number;
  discountPercentage: number;
  image: string;
  countInStock: number;
  isActive: boolean;
  category?: string;
};

type ProductCardProps = {
  product: ProductCardProduct;
  /** Show Add to Bag / Buy now at bottom (home new arrivals) */
  showActions?: boolean;
  showStock?: boolean;
  onRemove?: () => void;
  className?: string;
};

type WishlistItemFlexible = {
  productId: string | { _id: string };
};

interface FullProductDetails {
  _id: string;
  title: string;
  category?: string;
  ratings?: number;
  rating?: number;
  price: number;
  discountPrice?: number;
  discountedPrice?: number;
  discountPercentage: number;
  description?: string;
  images?: string[];
  image: string;
  stock?: number;
  countInStock?: number;
  variants?: {
    sizes?: string[];
    colors?: string[];
  };
  reviews?: Record<string, unknown>[];
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
}

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

  // Quick view modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullProduct, setFullProduct] = useState<FullProductDetails | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState("");
  const [modalSize, setModalSize] = useState("");
  const [modalColor, setModalColor] = useState("");
  const [modalCartError, setModalCartError] = useState("");
  const [modalAddingCart, setModalAddingCart] = useState(false);
  const [addedText, setAddedText] = useState(false);

  const handleCardAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    try {
      let defaultSize = "M";
      const cat = product.category || "";
      if (["Shoes", "Slippers", "shoes", "flats"].includes(cat)) {
        defaultSize = "7";
      } else if (!["Lowers", "Jeans", "Shirts", "dresses", "suits"].includes(cat)) {
        defaultSize = "One Size";
      }

      await axios.post(`/api/cart/${product._id}`, {
        size: defaultSize,
        color: "",
      });
      fetchUserCart();
      setAddedText(true);
      setTimeout(() => setAddedText(false), 2000);
    } catch (err: unknown) {
      console.error("Failed to add to cart from card:", err);
      if (err instanceof AxiosError) {
        const msg = err.response?.data?.message || "";
        if (
          err.response?.status === 401 ||
          msg.toLowerCase().includes("log in") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          router.push("/login");
        }
      }
    }
  };

  const handleCardBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
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

  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  // Lock scroll and fetch details when modal opens
  useEffect(() => {
    if (!isModalOpen) return;

    // Lock background scroll
    document.body.style.overflow = "hidden";

    const fetchDetails = async () => {
      setModalLoading(true);
      setModalCartError("");
      try {
        const response = await axios.get(`/api/product/${product._id}`);
        const p = response.data.product;
        setFullProduct(p);
        setSelectedImg(p.images && p.images.length > 0 ? p.images[0] : p.image);
        
        // Sizes variant default selection
        if (p.variants?.sizes?.length > 0) {
          setModalSize(p.variants.sizes[0]);
        } else {
          const cat = p.category;
          if (["Lowers", "Jeans", "Shirts", "dresses", "suits"].includes(cat)) {
            setModalSize("M");
          } else {
            setModalSize("One Size");
          }
        }

        // Colors variant default selection
        if (p.variants?.colors?.length > 0) {
          setModalColor(p.variants.colors[0]);
        } else {
          setModalColor("");
        }
      } catch (err) {
        console.error("Failed to fetch product details for modal:", err);
      } finally {
        setModalLoading(false);
      }
    };

    fetchDetails();

    return () => {
      // Restore background scroll
      document.body.style.overflow = "";
    };
  }, [isModalOpen, product._id]);

  // Modal 5-second image auto-transition loop
  useEffect(() => {
    if (!isModalOpen || !fullProduct) return;
    const images = fullProduct.images && fullProduct.images.length > 0 
      ? fullProduct.images 
      : [fullProduct.image];
      
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImg((current) => {
        const currentIndex = images.indexOf(current);
        const nextIndex = (currentIndex + 1) % images.length;
        return images[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [isModalOpen, fullProduct]);

  // Modal Add to Cart
  const handleModalAddToCart = async (buyNow = false) => {
    if (!user) {
      setIsModalOpen(false);
      router.push("/login");
      return;
    }
    if (!fullProduct || !isProductInStock(fullProduct)) {
      setModalCartError("Product is out of stock.");
      return;
    }
    setModalAddingCart(true);
    setModalCartError("");
    try {
      await axios.post(`/api/cart/${fullProduct._id}`, {
        size: modalSize,
        color: modalColor,
      });
      fetchUserCart();
      if (buyNow) {
        setIsModalOpen(false);
        router.push("/checkout");
      } else {
        setModalCartError("Added to bag!");
        setTimeout(() => setModalCartError(""), 3000);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const msg = error.response?.data?.message || "";
        if (
          error.response?.status === 401 ||
          msg.toLowerCase().includes("log in") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          setIsModalOpen(false);
          router.push("/login");
        } else {
          setModalCartError(msg || "Could not add to cart.");
        }
      }
    } finally {
      setModalAddingCart(false);
    }
  };

  return (
    <>
      <div
        className={`group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3 shadow-sm transition-all duration-300 hover:border-neutral-200 hover:shadow-md ${className}`}
      >
        {/* Image area with overlays */}
        <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-neutral-50 border border-neutral-100/50">
          {product.discountPercentage > 0 && (
            <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md bg-neutral-900 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm uppercase">
              <CiDiscount1 className="text-xs" />
              {Math.floor(product.discountPercentage)}% Off
            </div>
          )}

          <div className="absolute right-2 top-2 z-10 flex items-center gap-1.5">
            {!showActions && inStock && !onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) {
                    setIsModalOpen(true);
                  } else {
                    router.push("/login");
                  }
                }}
                className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white active:scale-95"
              >
                <ShoppingCart className="w-3.5 h-3.5 text-neutral-800" />
              </button>
            )}
            {!onRemove && (
              <button
                type="button"
                aria-label="Add to wishlist"
                className="flex size-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-all hover:bg-white active:scale-95 sm:size-9"
                onClick={(e) => {
                  e.stopPropagation();
                  if (user) {
                    addToWishlist(product._id);
                  } else {
                    router.push("/login");
                  }
                }}
              >
                {user && alreadyInWishlist ? (
                  <Heart className="size-4 fill-rose-600 text-rose-600" />
                ) : (
                  <Heart className="size-4 text-neutral-400 hover:text-neutral-800" />
                )}
              </button>
            )}
            {onRemove && (
              <button
                type="button"
                aria-label="Remove"
                className="flex size-8 items-center justify-center rounded-full bg-white/90 text-rose-500 shadow-sm backdrop-blur-sm hover:bg-rose-50 sm:size-9"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <IoCloseOutline className="size-5" />
              </button>
            )}
          </div>

          {/* Click photo to go to Product Page */}
          <div className="size-full cursor-pointer relative" onClick={goToProduct}>
            <Image
              src={product.image || "/placeholder.png"}
              alt={product.title}
              fill
              className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
            />
            {/* Quick View Hover Accent */}
            <div className="absolute inset-0 bg-neutral-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={handlePhotoClick}
                className="bg-white/95 text-[10px] font-bold uppercase tracking-wider text-neutral-900 px-4 py-2 rounded-lg shadow-sm border border-neutral-100 hover:bg-neutral-50 hover:scale-105 transition-all"
              >
                Quick View
              </button>
            </div>
          </div>
        </div>

        {/* Info */}
        <h3
          className="line-clamp-2 cursor-pointer font-serif text-[14px] font-semibold leading-snug text-neutral-900 transition-colors hover:text-neutral-600 sm:text-sm"
          onClick={goToProduct}
        >
          {product.title}
        </h3>

        <div
          className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-semibold"
          onClick={goToProduct}
        >
          {product.price > product.discountedPrice && (
            <span className="text-neutral-400 line-through">₹{product.price}</span>
          )}
          <span className="text-neutral-900 font-bold">
            ₹{product.discountedPrice}
          </span>
        </div>

        {showStock && (
          <p
            className={`mt-1 text-xs font-medium ${
              inStock ? "text-green-600" : "text-rose-600"
            }`}
          >
            {inStock ? "In Stock" : "Out of Stock"}
          </p>
        )}

        {showActions &&
          (inStock ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleCardAddToCart}
                className="w-full rounded-xl bg-pink-600 py-2.5 text-xs font-bold text-white transition-all hover:bg-pink-700 active:scale-[0.98] text-center shrink-0 uppercase tracking-wide"
              >
                {addedText ? "Added!" : "Add to Bag"}
              </button>
              <button
                type="button"
                onClick={handleCardBuyNow}
                className="w-full rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-xs font-bold text-rose-700 transition-all hover:bg-rose-100 hover:border-rose-300 active:scale-[0.98] text-center shrink-0 uppercase tracking-wide"
              >
                Buy Now
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="mt-4 w-full cursor-not-allowed rounded-xl border border-neutral-100 bg-neutral-50 py-2 text-xs font-medium text-neutral-400 uppercase tracking-wide"
            >
              Out of stock
            </button>
          ))}
      </div>

      {/* QUICK VIEW MODAL OVERLAY */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 cursor-default"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ duration: 0.25 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 z-50 p-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 transition-all active:scale-90"
              >
                <X className="w-4 h-4" />
              </button>

              {modalLoading || !fullProduct ? (
                <div className="flex min-h-[350px] items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <AiOutlineLoading3Quarters className="animate-spin text-3xl text-neutral-800" />
                    <p className="text-xs text-neutral-500 font-serif">Unpacking product details...</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 text-neutral-900">
                  
                  {/* Left Column: Image gallery */}
                  <div className="md:col-span-6 flex flex-col gap-4">
                    {/* Main Image View */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-100 p-4">
                      {fullProduct.discountPercentage > 0 && (
                        <span className="absolute left-4 top-4 z-10 rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-bold text-white tracking-wider uppercase">
                          {Math.floor(fullProduct.discountPercentage)}% Off
                        </span>
                      )}

                      <AnimatePresence mode="wait">
                        <motion.div
                          key={selectedImg}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.35 }}
                          className="relative w-full h-full"
                        >
                          <Image
                            src={selectedImg}
                            alt={fullProduct.title}
                            fill
                            className="object-contain p-2"
                          />
                        </motion.div>
                      </AnimatePresence>
                    </div>

                    {/* Thumbnail selectors */}
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {(fullProduct.images && fullProduct.images.length > 0 ? fullProduct.images : [fullProduct.image]).map((img: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImg(img)}
                          className={`relative w-[60px] h-[60px] rounded-lg overflow-hidden bg-neutral-50 border transition-all shrink-0 ${
                            selectedImg === img ? "border-neutral-950 ring-2 ring-neutral-200 scale-105" : "border-neutral-200"
                          }`}
                        >
                          <Image src={img} alt={`Thumb ${idx + 1}`} fill className="object-contain p-1" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: details */}
                  <div className="md:col-span-6 space-y-4">
                    <div>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">
                        {fullProduct.category}
                      </span>
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight">{fullProduct.title}</h2>
                    </div>

                    {/* Ratings */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.round(fullProduct.ratings ?? fullProduct.rating ?? 0) 
                                ? "fill-amber-400 text-amber-400" 
                                : "text-neutral-200"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                        {(fullProduct.ratings ?? fullProduct.rating ?? 0).toFixed(1)}
                      </span>
                      <span className="text-neutral-300">|</span>
                      <span className="text-neutral-400">
                        {fullProduct.reviews?.length || 0} reviews
                      </span>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-baseline gap-3 py-2 border-y border-neutral-100">
                      <span className="text-xl font-bold text-neutral-900">
                        ₹{(fullProduct.discountPrice ?? fullProduct.discountedPrice ?? 0).toLocaleString()}
                      </span>
                      {fullProduct.price > (fullProduct.discountPrice ?? fullProduct.discountedPrice ?? 0) && (
                        <>
                          <span className="text-sm text-neutral-400 line-through">
                            ₹{fullProduct.price.toLocaleString()}
                          </span>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            {Math.floor(fullProduct.discountPercentage)}% OFF
                          </span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-500 leading-relaxed max-h-[70px] overflow-y-auto scrollbar-none">
                      {fullProduct.description}
                    </p>

                    {/* Sizes Selection */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Select Size</span>
                      <div className="flex flex-wrap gap-1.5">
                        {(fullProduct.variants?.sizes && fullProduct.variants.sizes.length > 0 
                          ? fullProduct.variants.sizes 
                          : ["XS", "S", "M", "L", "XL"]
                        ).map((s: string) => (
                          <button
                            key={s}
                            onClick={() => setModalSize(s)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${
                              s === modalSize
                                ? "bg-neutral-900 text-white border-transparent"
                                : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors Selection (Conditional) */}
                    {fullProduct.variants?.colors && fullProduct.variants.colors.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Choose Color</span>
                        <div className="flex items-center gap-2">
                          {fullProduct.variants.colors.map((colName: string) => {
                            const cleanCol = colName.trim().toLowerCase();
                            return (
                              <button
                                key={colName}
                                onClick={() => setModalColor(colName)}
                                title={colName}
                                className={`relative w-7 h-7 rounded-full border transition-all p-0.5 ${
                                  colName === modalColor ? "border-neutral-900 scale-105" : "border-transparent"
                                }`}
                              >
                                <div
                                  style={{ backgroundColor: cleanCol }}
                                  className="w-full h-full rounded-full shadow-inner border border-black/5 flex items-center justify-center"
                                >
                                  {colName === modalColor && <Check className="w-3 h-3 text-white mix-blend-difference" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Purchase buttons */}
                    <div className="pt-2">
                      {isProductInStock(fullProduct) ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            disabled={modalAddingCart}
                            onClick={() => handleModalAddToCart(false)}
                            className="py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-bold text-xs uppercase tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md shadow-pink-100/50"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> + Bag
                          </button>
                          <button
                            disabled={modalAddingCart}
                            onClick={() => handleModalAddToCart(true)}
                            className="py-2.5 rounded-xl bg-rose-950 text-white font-bold text-xs uppercase tracking-wide hover:bg-rose-900 transition-all disabled:opacity-50"
                          >
                            Buy Now
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-400 font-bold uppercase text-xs cursor-not-allowed"
                        >
                          Out of stock
                        </button>
                      )}

                      {modalCartError && (
                        <p className={`text-xs mt-2 text-center font-medium ${modalCartError.includes("Added") ? "text-green-600" : "text-rose-600"}`}>
                          {modalCartError}
                        </p>
                      )}
                    </div>

                    {/* Specifications */}
                    <div className="pt-2 border-t border-neutral-100 space-y-1 text-[11px] text-neutral-600">
                      <div className="flex justify-between border-b border-neutral-50 py-0.5">
                        <span className="font-semibold text-neutral-400">Category</span>
                        <span>{fullProduct.category}</span>
                      </div>
                      <div className="flex justify-between border-b border-neutral-50 py-0.5">
                        <span className="font-semibold text-neutral-400">Weight</span>
                        <span>{fullProduct.weight ? `${fullProduct.weight} kg` : "N/A"}</span>
                      </div>
                      <div className="flex justify-between py-0.5">
                        <span className="font-semibold text-neutral-400">Dimensions</span>
                        <span>
                          {fullProduct.length || fullProduct.breadth || fullProduct.height 
                            ? `${fullProduct.length || "-"} x ${fullProduct.breadth || "-"} x ${fullProduct.height || "-"} cm` 
                            : "N/A"
                          }
                        </span>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
