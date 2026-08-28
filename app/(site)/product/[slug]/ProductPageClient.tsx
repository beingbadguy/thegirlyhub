"use client";

import axios, { AxiosError } from "axios";
import Image from "next/image";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/store";
import { isProductInStock } from "@/lib/productStock";
import ProductCard from "@/components/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RotateCcw,
  Upload,
  X,
  Star,
  Sparkles,
  Check,
  MessageSquare,
  AlertCircle
} from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type ReviewType = {
  _id?: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
};

type Product = {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  price: number;
  discountedPrice: number; // legacy
  discountPrice?: number; // new
  countInStock: number; // legacy
  stock?: number; // new
  image: string; // legacy
  images?: string[]; // new
  rating: number; // legacy
  ratings?: number; // new
  numReviews: number;
  isActive: boolean;
  isFeatured?: boolean;
  discountPercentage: number;
  info?: string;
  category: string;
  variants?: {
    sizes: string[];
    colors: string[];
  };
  reviews?: ReviewType[];
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
};

interface ProductPageClientProps {
  initialProduct: Product;
  initialRecommendations: Product[];
  slug: string;
}

const ProductPageClient = ({ initialProduct, initialRecommendations, slug }: ProductPageClientProps) => {
  const { addToWishlist, user, fetchUserCart } = useAuthStore();
  const router = useRouter();

  const [product, setProduct] = useState<Product>(initialProduct);
  const [similarProducts, setSimilarProducts] = useState<Product[]>(initialRecommendations);
  const [addingCart, setAddingCart] = useState<boolean>(false);

  // Gallery states
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({ display: "none" });
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Custom variants states
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [cartError, setCartError] = useState("");
  const [expandDesc, setExpandDesc] = useState(false);

  // Sticky mobile CTA state
  const [showStickyBar, setShowStickyBar] = useState(false);
  const buySectionRef = useRef<HTMLDivElement>(null);

  // Review states
  const [reviewEligible, setReviewEligible] = useState<boolean>(false);
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewPhotos, setReviewPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [reviewError, setReviewError] = useState<string>("");
  const [reviewSuccess, setReviewSuccess] = useState<string>("");

  // Lightbox state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const inStock = isProductInStock(product);

  const checkEligibility = useCallback(async (productId: string) => {
    if (!user) return;
    try {
      const response = await axios.get(`/api/products/${productId}/review-eligibility`);
      setReviewEligible(response.data.eligible);
    } catch (error) {
      console.error("Error checking review eligibility:", error);
    }
  }, [user]);

  const addToCart = async (goDirectlyToCart = false) => {
    if (!product?._id || !inStock) {
      setCartError("This product is out of stock.");
      return;
    }
    setAddingCart(true);
    setCartError("");
    try {
      await axios.post(`/api/cart/${product._id}`, { size, color });
      fetchUserCart();
      if (goDirectlyToCart) {
        router.push("/checkout");
      } else {
        setCartError("Added to bag!");
        setTimeout(() => setCartError(""), 3000);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const msg = error.response?.data?.message || "";
        if (
          error.response?.status === 401 ||
          msg.toLowerCase().includes("log in") ||
          msg.toLowerCase().includes("unauthorized")
        ) {
          router.push("/login");
        } else {
          setCartError(msg || "Could not add to cart.");
        }
      }
    } finally {
      setAddingCart(false);
    }
  };

  // Handle review photo selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (reviewPhotos.length + files.length > 4) {
        setReviewError("You can upload a maximum of 4 photos.");
        return;
      }

      const newPhotos = [...reviewPhotos, ...files];
      setReviewPhotos(newPhotos);
      setReviewError("");

      const previews = files.map(file => URL.createObjectURL(file));
      setPhotoPreviews([...photoPreviews, ...previews]);
    }
  };

  // Remove photo from selection list
  const removePhoto = (index: number) => {
    const updatedPhotos = [...reviewPhotos];
    updatedPhotos.splice(index, 1);
    setReviewPhotos(updatedPhotos);

    const updatedPreviews = [...photoPreviews];
    URL.revokeObjectURL(updatedPreviews[index]);
    updatedPreviews.splice(index, 1);
    setPhotoPreviews(updatedPreviews);
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!reviewComment.trim()) {
      setReviewError("Please write a comment.");
      return;
    }

    setSubmittingReview(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      const formData = new FormData();
      formData.append("rating", String(reviewRating));
      formData.append("comment", reviewComment);

      reviewPhotos.forEach(file => {
        formData.append("photos", file);
      });

      const response = await axios.post(`/api/products/${product._id}/reviews`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (response.data.success) {
        setReviewSuccess("Thank you! Your review has been posted.");
        setReviewComment("");
        setReviewPhotos([]);
        setPhotoPreviews([]);
        setReviewEligible(false); // Disallow posting again

        // Refresh product details locally
        try {
          const refreshRes = await axios.get(`/api/product/${encodeURIComponent(slug)}`);
          setProduct(refreshRes.data.product);
        } catch (err) {
          console.error("Failed to refresh product specs:", err);
        }
      }
    } catch (error: unknown) {
      console.error("Error submitting review:", error);
      if (error instanceof AxiosError) {
        setReviewError(error.response?.data?.message || "Failed to submit review.");
      } else {
        setReviewError("Failed to submit review.");
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  // Magnifier glass zoom effect (Desktop only)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundImage: `url(${selectedImage})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: "220%",
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
  };

  const allProductsOfWishlist = user?.wishlist?.[0]?.products || [];

  type WishlistItem = {
    productId: string | { _id: string };
  };

  const alreadyInWishlist = (id: string) => {
    return allProductsOfWishlist.some((item: WishlistItem) => {
      if (typeof item.productId === "string") {
        return item.productId === id;
      }
      return item.productId?._id === id;
    });
  };

  // Intersection observer for sticky CTA bar and mobile detection
  useEffect(() => {
    const handleScroll = () => {
      if (buySectionRef.current) {
        const rect = buySectionRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Update product state when SSR props update
  useEffect(() => {
    setProduct(initialProduct);
    setSimilarProducts(initialRecommendations);
    window.scrollTo(0, 0);

    const primaryImage = initialProduct.images && initialProduct.images.length > 0
      ? initialProduct.images[0]
      : initialProduct.image;
    setSelectedImage(primaryImage);

    if (initialProduct.variants?.sizes && initialProduct.variants.sizes.length > 0) {
      setSize(initialProduct.variants.sizes[0]);
    } else {
      const cat = initialProduct.category;
      if (["Lowers", "Jeans", "Shirts", "dresses", "suits"].includes(cat)) {
        setSize("M");
      } else if (["Shoes", "Slippers", "shoes", "flats"].includes(cat)) {
        setSize("7");
      } else {
        setSize("One Size");
      }
    }

    if (initialProduct.variants?.colors && initialProduct.variants.colors.length > 0) {
      setColor(initialProduct.variants.colors[0]);
    } else {
      setColor("");
    }

    if (user && initialProduct) {
      checkEligibility(initialProduct._id);
    }
  }, [initialProduct, initialRecommendations, slug, user, checkEligibility]);

  // Auto-change image in a loop every 5 seconds
  useEffect(() => {
    if (!product) return;
    const images = product.images && product.images.length > 0
      ? product.images
      : [product.image];

    if (images.length <= 1 || lightboxImage) return;

    const interval = setInterval(() => {
      setSelectedImage((current) => {
        const currentIndex = images.indexOf(current);
        const nextIndex = (currentIndex + 1) % images.length;
        return images[nextIndex];
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [product, lightboxImage]);

  // Lock background scroll when lightbox is open
  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxImage]);

  // Fallbacks for display
  const displayPrice = product.price;
  const displayDiscountPrice = product.discountPrice ?? product.discountedPrice;
  const displayStock = product.stock ?? product.countInStock;
  const displayRatings = product.ratings ?? product.rating;
  const displayImages = product.images && product.images.length > 0
    ? product.images
    : [product.image];

  const colorsList = product.variants?.colors && product.variants.colors.length > 0
    ? product.variants.colors
    : [];
  const showColorSelector = colorsList.length > 0;

  return (
    <div className="min-h-screen bg-[#FAF9F9] px-4 py-6 md:px-8 font-sans text-neutral-900">
      
      {/* Breadcrumbs */}
      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wide text-neutral-400">
        <span className="cursor-pointer transition-colors hover:text-neutral-800" onClick={() => router.push("/")}>
          Home
        </span>
        <span>/</span>
        <span className="cursor-pointer transition-colors hover:text-neutral-800 capitalize" onClick={() => router.push(`/category/${encodeURIComponent(product.category)}`)}>
          {product.category}
        </span>
        <span>/</span>
        <span className="text-neutral-800 font-bold">{product.title}</span>
      </div>

      {/* Main product display */}
      <div className="grid grid-cols-1 gap-6 lg:gap-12 lg:grid-cols-12 max-w-7xl mx-auto bg-white rounded-3xl p-4 md:p-8 border border-neutral-100 shadow-sm">
        
        {/* Left Section: Image Gallery */}
        <div className="lg:col-span-6 flex flex-col md:flex-row gap-3 md:gap-4">
          {/* Thumbnails list */}
          <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-y-auto max-h-[450px] scrollbar-none pb-2 md:pb-0">
            {displayImages.map((img, idx) => (
              <button
                key={idx}
                className={`relative w-[64px] h-[64px] md:w-[75px] md:h-[75px] rounded-xl overflow-hidden bg-neutral-50 border transition-all duration-300 shrink-0 ${selectedImage === img
                  ? "border-neutral-950 ring-2 ring-neutral-200 ring-offset-1 scale-105"
                  : "border-neutral-200 hover:border-neutral-400"
                  }`}
                onClick={() => setSelectedImage(img)}
              >
                <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-contain p-1" />
              </button>
            ))}
          </div>

          {/* Main Display Image Container */}
          <div className="relative flex-1 aspect-square rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-100 p-4 order-1 md:order-2">
            {product.discountPercentage > 0 && (
              <span className="absolute left-4 top-4 z-10 rounded-full bg-neutral-900 px-3 py-1 text-[10px] font-bold text-white tracking-wider uppercase shadow-sm">
                {Math.floor(product.discountPercentage)}% Off
              </span>
            )}

            {/* Wishlist floating heart */}
            <button
              onClick={() => (user ? addToWishlist(product._id) : router.push("/login"))}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 border border-neutral-100 shadow-sm transition-all hover:bg-white active:scale-95"
            >
              {user && alreadyInWishlist(product._id) ? (
                <Heart className="h-5 w-5 fill-rose-600 text-rose-600" />
              ) : (
                <Heart className="h-5 w-5 text-neutral-400 hover:text-neutral-800 transition-colors" />
              )}
            </button>

            {/* Magnifier glass zoom area */}
            <div
              className="relative w-full h-full cursor-zoom-in"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={() => setLightboxImage(selectedImage)}>
              <Image
                src={selectedImage}
                alt={product.title}
                fill
                priority
                className="object-contain p-4"
              />

              {/* Magnifier Lens Container (Desktop only) */}
              {!isMobile && (
                <div
                  style={zoomStyle}
                  className="absolute inset-0 z-20 pointer-events-none rounded-xl border border-neutral-200 bg-white"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Details & Purchase actions */}
        <div ref={buySectionRef} className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-800 text-xs font-semibold uppercase tracking-wider">
              {product.category}
            </span>

            <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight text-neutral-900">
              {product.title}
            </h1>

            {/* Rating Stars average */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(displayRatings)
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-200"
                      }`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded">
                {displayRatings.toFixed(1)} / 5
              </span>
              <span className="text-xs text-neutral-300">|</span>
              <span className="text-xs text-neutral-500 font-medium cursor-pointer hover:underline" onClick={() => {
                const el = document.getElementById("reviews-section");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>
                {product.reviews?.length || 0} reviews
              </span>
            </div>

            {/* Price display */}
            <div className="flex items-baseline gap-4 py-2 border-y border-neutral-100">
              <span className="text-2xl font-bold text-neutral-900">
                ₹{displayDiscountPrice.toLocaleString()}
              </span>
              {displayPrice > displayDiscountPrice && (
                <>
                  <span className="text-md text-neutral-400 line-through">
                    ₹{displayPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">
                    Save ₹{(displayPrice - displayDiscountPrice).toLocaleString()}
                  </span>
                </>
              )}
            </div>

            <p className="text-sm leading-relaxed text-neutral-600">
              {product.description}
            </p>

            {/* Sizes variants */}
            {product.variants?.sizes && product.variants.sizes.length > 0 && (
              <div className="space-y-2 py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Select Size
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      className={`min-w-[45px] h-[40px] px-3 rounded-lg text-xs font-semibold uppercase tracking-wider border transition-all ${s === size
                        ? "bg-neutral-900 text-white border-transparent shadow-sm"
                        : "bg-white text-neutral-800 border-neutral-200 hover:border-neutral-400"
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colors variant swatches */}
            {showColorSelector && (
              <div className="space-y-2 py-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Choose Color
                </span>
                <div className="flex items-center gap-3">
                  {colorsList.map((colName) => {
                    const cleanColor = colName.trim().toLowerCase();
                    return (
                      <button
                        key={colName}
                        onClick={() => setColor(colName)}
                        title={colName}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all p-0.5 ${colName === color
                          ? "border-neutral-950 scale-110 shadow-sm"
                          : "border-transparent hover:scale-105"
                          }`}
                      >
                        <div
                          style={{ backgroundColor: cleanColor }}
                          className="w-full h-full rounded-full shadow-inner border border-black/5 flex items-center justify-center"
                        >
                          {colName === color && <Check className="w-3 h-3 text-white mix-blend-difference" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-4 pt-4">
            {displayStock <= 0 ? (
              <button
                disabled
                className="w-full py-3.5 text-center rounded-xl bg-neutral-100 border border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider cursor-not-allowed text-sm"
              >
                Out of Stock
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  disabled={addingCart}
                  onClick={() => (user ? addToCart(false) : router.push("/login"))}
                  className="flex-1 py-3.5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-500 hover:from-pink-500 hover:to-rose-600 text-white font-semibold text-xs tracking-wider uppercase shadow-md shadow-pink-100/50 transition-all disabled:opacity-50"
                >
                  <ShoppingCart className="w-4 h-4" /> Add to Bag
                </button>
                <button
                  disabled={addingCart}
                  onClick={() => (user ? addToCart(true) : router.push("/login"))}
                  className="flex-1 py-3.5 flex items-center justify-center gap-2 rounded-xl bg-rose-950 text-white font-semibold text-xs tracking-wider uppercase hover:bg-rose-900 transition-all disabled:opacity-50"
                >
                  Buy Now
                </button>
              </div>
            )}

            {cartError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-sm text-center font-medium ${cartError.includes("Added") ? "text-green-600" : "text-rose-600"}`}
              >
                {cartError}
              </motion.p>
            )}
          </div>
        </div>
      </div>

      {/* Trust Badges section */}
      <div className="my-6 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 bg-white border border-neutral-100 p-5 rounded-2xl shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-800">Free Shipping</h4>
            <p className="text-xs text-neutral-400 font-medium">On all orders above ₹499</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white border border-neutral-100 p-5 rounded-2xl shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-100">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-800">Easy Returns</h4>
            <p className="text-xs text-neutral-400 font-medium">7-day replacement guarantee</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white border border-neutral-100 p-5 rounded-2xl shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-800">Secure Checkout</h4>
            <p className="text-xs text-neutral-400 font-medium">100% protected safe payments</p>
          </div>
        </div>
      </div>

      {/* Product Specifications Section */}
      <div className="max-w-7xl mx-auto bg-white border border-neutral-100 p-6 md:p-8 rounded-3xl mb-10 shadow-sm">
        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 border-b border-neutral-100 pb-3 text-neutral-800 mb-4">
          Product Specifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm text-neutral-700 pb-6 border-b border-neutral-50">
          <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100/50">
            <span className="font-semibold text-neutral-400">Category</span>
            <span>{product.category}</span>
          </div>
          <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100/50">
            <span className="font-semibold text-neutral-400">Stock Status</span>
            <span className={displayStock > 0 ? "text-green-600 font-medium" : "text-rose-600 font-medium"}>
              {displayStock > 0 ? `In Stock (${displayStock} units)` : "Out of Stock"}
            </span>
          </div>
          <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100/50">
            <span className="font-semibold text-neutral-400">Weight</span>
            <span>{product.weight ? `${product.weight} kg` : "N/A"}</span>
          </div>
          <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100/50">
            <span className="font-semibold text-neutral-400">Dimensions</span>
            <span>
              {product.length || product.breadth || product.height ? (
                `${product.length || "-"} x ${product.breadth || "-"} x ${product.height || "-"} cm (L x B x H)`
              ) : (
                "N/A"
              )}
            </span>
          </div>
        </div>

        <div className="pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block mb-2">Description / Info</span>
          <div className={`overflow-hidden transition-all duration-500 ${expandDesc ? "max-h-max" : "max-h-[150px] relative"}`}>
            <pre className="overflow-auto whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-600 font-sans">
              {product.info || product.description}
            </pre>
            {!expandDesc && (
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            )}
          </div>
          <button
            onClick={() => setExpandDesc(!expandDesc)}
            className="text-xs font-bold text-neutral-800 hover:text-neutral-900 tracking-wider uppercase border border-neutral-200 px-4 py-2 rounded-xl bg-neutral-50/50 hover:bg-neutral-100 transition-all cursor-pointer block mx-auto mt-4"
          >
            {expandDesc ? "Read Less" : "Read Full Info"}
          </button>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div id="reviews-section" className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">

        {/* Write a Review Block */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm flex flex-col justify-start">
          <h2 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
            Ratings & Reviews
          </h2>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-4xl font-extrabold text-neutral-950">
              {displayRatings.toFixed(1)}
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(displayRatings)
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-200"
                      }`}
                  />
                ))}
              </div>
              <p className="text-[11px] font-semibold text-neutral-400">Based on {product.reviews?.length || 0} reviews</p>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            {reviewEligible ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <span className="text-xs font-bold text-neutral-800 block uppercase tracking-wider">
                  Post a Review
                </span>

                {/* Stars selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Star Rating</label>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: 5 }, (_, i) => {
                      const starVal = i + 1;
                      return (
                        <button
                          type="button"
                          key={i}
                          onClick={() => setReviewRating(starVal)}
                          className="focus:outline-none transition-transform active:scale-95"
                        >
                          <Star
                            className={`w-7 h-7 ${starVal <= reviewRating
                              ? "fill-amber-400 text-amber-400 scale-105"
                              : "text-neutral-200 hover:text-amber-200"
                              }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment Text */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Your Comments</label>
                  <textarea
                    rows={3}
                    placeholder="Provide your experience with this product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-900 focus:border-neutral-400 focus:outline-none"
                  />
                </div>

                {/* Photo Uploader */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                    Upload Photos (Max 4)
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {photoPreviews.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50">
                        <Image src={url} alt="Review Preview" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute right-0.5 top-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-black"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {reviewPhotos.length < 4 && (
                      <label className="w-16 h-16 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 hover:border-neutral-400 bg-neutral-50 cursor-pointer transition-colors">
                        <Upload className="w-4 h-4 text-neutral-400" />
                        <span className="text-[9px] font-semibold text-neutral-400 mt-1">Add Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handlePhotoSelect}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {reviewError && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 p-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-green-600 bg-green-50 p-2 rounded-lg">
                    <Check className="w-3.5 h-3.5 shrink-0" /> {reviewSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 rounded-xl bg-neutral-900 text-white font-semibold text-xs tracking-wider uppercase hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {submittingReview ? (
                    <AiOutlineLoading3Quarters className="animate-spin text-sm" />
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center py-6 px-4 bg-neutral-50 border border-neutral-100 rounded-2xl space-y-2">
                <MessageSquare className="w-6 h-6 text-neutral-400 mx-auto" />
                <p className="text-xs font-semibold text-neutral-500 leading-relaxed">
                  Only customers who have purchased and received this product are verified to write reviews.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Existing reviews list */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-neutral-100 shadow-sm">
          <h2 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            Verified Reviews ({product.reviews?.length || 0})
          </h2>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev, idx) => (
                <div key={idx} className="border-b border-neutral-100 pb-6 last:border-b-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-xs uppercase border border-neutral-200">
                        {rev.username.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-800">{rev.username}</h4>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-200"
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-semibold">
                      {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  <p className="text-xs leading-relaxed text-neutral-600 font-sans">
                    {rev.comment}
                  </p>

                  {/* Review photos gallery */}
                  {rev.photos && rev.photos.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      {rev.photos.map((photoUrl, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => setLightboxImage(photoUrl)}
                          className="relative w-14 h-14 rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                        >
                          <Image src={photoUrl} alt="Customer Photo" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 space-y-2">
                <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-xs font-semibold text-neutral-400">No reviews yet for this product.</p>
                <p className="text-[10px] text-neutral-300">Be the first to purchase and review!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar products section */}
      <div className="max-w-7xl mx-auto my-12">
        <h2 className="text-lg md:text-xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
          You May Also Like <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
        </h2>
        <div className="my-4 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {similarProducts.length > 0 ? (
            similarProducts.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))
          ) : (
            <p className="col-span-full text-center text-neutral-400 py-6 text-xs">
              No related products found.
            </p>
          )}
        </div>
      </div>

      {/* Lightbox photo viewer overlay */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-sm cursor-zoom-out p-4"
          >
            <div
              className="relative max-h-full max-w-full rounded-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Fullscreen Customer View"
                className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
              />
              <button
                className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur transition-all active:scale-95"
                onClick={() => setLightboxImage(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Mobile Action Bar */}
      <AnimatePresence>
        {showStickyBar && displayStock > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 border-t border-neutral-200 p-4 shadow-2xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50 shrink-0">
                <Image src={selectedImage} alt={product.title} fill className="object-contain p-1" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-neutral-800 truncate max-w-[120px]">{product.title}</h4>
                <p className="text-sm font-bold text-rose-600">₹{displayDiscountPrice.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                disabled={addingCart}
                onClick={() => (user ? addToCart(false) : router.push("/login"))}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95"
              >
                + Bag
              </button>
              <button
                disabled={addingCart}
                onClick={() => (user ? addToCart(true) : router.push("/login"))}
                className="px-5 py-2.5 rounded-xl bg-rose-950 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95"
              >
                Buy Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ProductPageClient;
