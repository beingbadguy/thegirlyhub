"use client";

import axios, { AxiosError } from "axios";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/store";
import { compressImage } from "@/utils/image";
import { isProductInStock } from "@/lib/productStock";
import ProductCard from "@/components/ProductCard";
import BreadcrumbHome from "@/components/BreadcrumbHome";
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
  Clock3,
  MessageSquare,
  AlertCircle,
  Share2,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Ruler,
} from "lucide-react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { SiGooglepay, SiPaytm } from "react-icons/si";
import { FaWhatsapp } from "react-icons/fa";
import FloralAccent from "@/components/decorations/FloralAccent";

type ReviewType = {
  _id?: string;
  userId: string;
  username: string;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
};

type ProductVariant = {
  sku?: string;
  attributes?: { color?: string; size?: string };
  price: number;
  discountedPrice: number;
  stock: number;
  images?: string[];
  weight?: number;
};

type Product = {
  _id: string;
  name?: string;
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
  subCategory?: string;
  brand?: string;
  material?: string;
  plating?: string;
  stoneType?: string;
  color?: string;
  occasion?: string;
  style?: string;
  gender?: string;
  setType?: string;
  shortDescription?: string;
  longDescription?: string;
  status?: string;
  isNewArrival?: boolean;
  totalStock?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  totalReviews?: number;
  metaTitle?: string;
  metaDescription?: string;
  dimensions?: { length?: number; breadth?: number; height?: number };
  variants?: ProductVariant[] | { sizes: string[]; colors: string[] };
  sizes?: string[];
  reviews?: ReviewType[];
  weight?: number;
  length?: number;
  breadth?: number;
  height?: number;
};

const BANGLE_SIZE_CHART = [
  { size: "2.2", diameterIn: "2.12\"", diameterMm: "54.0 mm", wrist: "6.67\" (16.9 cm)", note: "Extra Small" },
  { size: "2.3", diameterIn: "2.18\"", diameterMm: "55.5 mm", wrist: "6.87\" (17.4 cm)", note: "Petite" },
  { size: "2.4", diameterIn: "2.25\"", diameterMm: "57.2 mm", wrist: "7.06\" (17.9 cm)", note: "Small" },
  { size: "2.5", diameterIn: "2.31\"", diameterMm: "58.7 mm", wrist: "7.26\" (18.4 cm)", note: "Small-Med" },
  { size: "2.6", diameterIn: "2.38\"", diameterMm: "60.3 mm", wrist: "7.46\" (18.9 cm)", note: "Medium (Popular)" },
  { size: "2.8", diameterIn: "2.50\"", diameterMm: "63.5 mm", wrist: "7.85\" (19.9 cm)", note: "Large (Popular)" },
  { size: "2.10", diameterIn: "2.63\"", diameterMm: "66.7 mm", wrist: "8.24\" (20.9 cm)", note: "Extra Large" },
  { size: "Free Size", diameterIn: "Adjustable", diameterMm: "Flexible", wrist: "Fits most wrists", note: "Adjustable" },
  { size: "2.12", diameterIn: "2.75\"", diameterMm: "69.8 mm", wrist: "8.64\" (21.9 cm)", note: "2X Large" },
  { size: "2.14", diameterIn: "2.88\"", diameterMm: "73.0 mm", wrist: "9.03\" (22.9 cm)", note: "Custom" },
  { size: "3", diameterIn: "3.00\"", diameterMm: "76.2 mm", wrist: "9.42\" (23.9 cm)", note: "3X Large" },
];

function getVariantOptions(
  variants: Product["variants"],
  explicitSizes?: string[],
  category = "",
  subCategory = "",
  title = "",
) {
  const directSizes = Array.isArray(explicitSizes)
    ? explicitSizes.map((s) => String(s).trim()).filter(Boolean)
    : [];

  if (directSizes.length > 0) {
    const colors = Array.isArray(variants)
      ? ([
          ...new Set(
            variants
              .map((variant) => variant.attributes?.color)
              .filter(Boolean),
          ),
        ] as string[])
      : [];
    return {
      sizes: directSizes,
      colors,
    };
  }

  const cat = (category || "").toLowerCase();
  const subCat = (subCategory || "").toLowerCase();
  const name = (title || "").toLowerCase();

  const isBangleOrBracelet =
    cat.includes("bangle") ||
    cat.includes("bracelet") ||
    subCat.includes("bangle") ||
    subCat.includes("bracelet") ||
    name.includes("bangle") ||
    name.includes("bracelet") ||
    name.includes("kada");

  if (isBangleOrBracelet) {
    const colors = Array.isArray(variants)
      ? ([
          ...new Set(
            variants
              .map((variant) => variant.attributes?.color)
              .filter(Boolean),
          ),
        ] as string[])
      : [];
    return {
      sizes: ["2.2", "2.4", "2.6", "2.8", "2.10", "Free Size"],
      colors,
    };
  }

  if (!variants) return { sizes: [], colors: [] };
  if (Array.isArray(variants)) {
    return {
      sizes: [
        ...new Set(
          variants.map((variant) => variant.attributes?.size).filter(Boolean),
        ),
      ] as string[],
      colors: [
        ...new Set(
          variants.map((variant) => variant.attributes?.color).filter(Boolean),
        ),
      ] as string[],
    };
  }
  return variants;
}

interface ProductPageClientProps {
  initialProduct: Product;
  initialRecommendations: Product[];
  slug: string;
}

const getRandomViewerCount = () => Math.floor(Math.random() * 39) + 11;

const ProductPageClient = ({
  initialProduct,
  initialRecommendations,
  slug,
}: ProductPageClientProps) => {
  const { addToWishlist, user, userWishlist, fetchUserCart, openCart } = useAuthStore();
  const router = useRouter();

  const [product, setProduct] = useState<Product>(initialProduct);
  const [similarProducts, setSimilarProducts] = useState<Product[]>(
    initialRecommendations,
  );
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState<
    Product[]
  >([]);
  const [addingCart, setAddingCart] = useState<boolean>(false);
  const [quantity, setQuantity] = useState(1);

  const defaultImg =
    (initialProduct.images && initialProduct.images.length > 0
      ? initialProduct.images[0]
      : initialProduct.image) || "/final_gh.png";

  // Gallery states
  const [selectedImage, setSelectedImage] = useState<string>(defaultImg);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({
    display: "none",
  });
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isZooming, setIsZooming] = useState<boolean>(false);
  const [activeViewers, setActiveViewers] = useState<number>(12);
  const [showSizeGuide, setShowSizeGuide] = useState<boolean>(false);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {
      desc: true,
      details: false,
      shipping: false,
    },
  );

  // Custom variants states
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [cartError, setCartError] = useState("");
  const [expandDesc, setExpandDesc] = useState(false);

  // Sticky mobile CTA state
  const [showStickyBar, setShowStickyBar] = useState(true);
  const buySectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveViewers(getRandomViewerCount());

    const viewerTimer = window.setInterval(() => {
      setActiveViewers(getRandomViewerCount());
    }, 8000);

    return () => window.clearInterval(viewerTimer);
  }, []);

  useEffect(() => {
    const recordAndLoadRecentlyViewed = async () => {
      try {
        await axios.post("/api/user/recently-viewed", {
          productId: initialProduct._id,
        });
        const response = await axios.get("/api/user/recently-viewed");
        setRecentlyViewedProducts(
          (response.data.products ?? []).filter(
            (recentProduct: Product) =>
              recentProduct._id !== initialProduct._id,
          ),
        );
      } catch {
        // Recently viewed is supplementary and should never block the product page.
      }
    };

    if (user) {
      recordAndLoadRecentlyViewed();
    }
  }, [initialProduct._id, user]);

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

  // Share state
  const [shareSuccess, setShareSuccess] = useState(false);

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/product/${product.slug}`;
      if (navigator.share) {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const inStock = isProductInStock(product);

  // Delivery estimate (today + 5 days), computed once on mount so it stays
  // stable for the lifetime of the page view.
  const [deliveryDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 5);
    return date;
  });

  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const checkEligibility = useCallback(
    async (productId: string) => {
      if (!user) return;
      try {
        const response = await axios.get(
          `/api/products/${productId}/review-eligibility`,
        );
        setReviewEligible(response.data.eligible);
      } catch (error) {
        console.error("Error checking review eligibility:", error);
      }
    },
    [user],
  );

  const addToCart = async (goDirectlyToCart = false) => {
    if (!product?._id || !inStock) {
      setCartError("This product is out of stock.");
      return;
    }
    setAddingCart(true);
    setCartError("");
    try {
      for (let index = 0; index < quantity; index += 1) {
        await useAuthStore.getState().addToCart(product._id, size);
      }
      if (goDirectlyToCart) {
        router.push("/checkout");
      } else {
        openCart();
        setCartError("Added to bag!");
        setTimeout(() => setCartError(""), 3000);
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        setCartError(error.response?.data?.message || "Could not add to cart.");
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

      const previews = files.map((file) => URL.createObjectURL(file));
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

      const compressedPhotos = await Promise.all(
        reviewPhotos.map((file) => compressImage(file)),
      );
      compressedPhotos.forEach((file) => {
        formData.append("photos", file);
      });

      const response = await axios.post(
        `/api/products/${product._id}/reviews`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        setReviewSuccess("Thank you! Your review has been posted.");
        setReviewComment("");
        setReviewPhotos([]);
        setPhotoPreviews([]);
        setReviewEligible(false); // Disallow posting again

        // Refresh product details locally
        try {
          const refreshRes = await axios.get(
            `/api/product/${encodeURIComponent(slug)}`,
          );
          setProduct(refreshRes.data.product);
        } catch (err) {
          console.error("Failed to refresh product specs:", err);
        }
      }
    } catch (error: unknown) {
      console.error("Error submitting review:", error);
      if (error instanceof AxiosError) {
        setReviewError(
          error.response?.data?.message || "Failed to submit review.",
        );
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
    setIsZooming(true);
    const { left, top, width, height } =
      e.currentTarget.getBoundingClientRect();
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
    setIsZooming(false);
    setZoomStyle({ display: "none" });
  };

  const allProductsOfWishlist =
    userWishlist?.products || user?.wishlist?.[0]?.products || [];

  type WishlistItem = {
    productId: string | { _id: string; id?: string };
    _id?: string;
  };

  const alreadyInWishlist = (id: string) => {
    return allProductsOfWishlist.some((item: WishlistItem) => {
      if (typeof item.productId === "string") {
        return item.productId === id;
      }
      return (
        item.productId?._id === id ||
        (item.productId as any)?.id === id ||
        item._id === id
      );
    });
  };

  // Intersection observer for sticky CTA bar and mobile detection
  useEffect(() => {
    const handleScroll = () => {
      if (buySectionRef.current) {
        setShowStickyBar(window.scrollY <= 80);
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

    const primaryImage =
      initialProduct.images && initialProduct.images.length > 0
        ? initialProduct.images[0]
        : initialProduct.image;
    setSelectedImage(primaryImage);

    const initialVariantOptions = getVariantOptions(
      initialProduct.variants,
      initialProduct.sizes,
      initialProduct.category,
      initialProduct.subCategory,
      initialProduct.title || initialProduct.name,
    );
    if (initialVariantOptions.sizes.length > 0) {
      setSize(initialVariantOptions.sizes[0]);
    } else {
      const cat = (initialProduct.category || "").toLowerCase();
      const subCat = (initialProduct.subCategory || "").toLowerCase();
      if (
        cat.includes("bangle") ||
        cat.includes("bracelet") ||
        subCat.includes("bangle") ||
        subCat.includes("bracelet")
      ) {
        setSize("2.6");
      } else if (["lowers", "jeans", "shirts", "dresses", "suits"].includes(cat)) {
        setSize("M");
      } else if (["shoes", "slippers", "flats"].includes(cat)) {
        setSize("7");
      } else {
        setSize("Free Size");
      }
    }

    if (initialVariantOptions.colors.length > 0) {
      setColor(initialVariantOptions.colors[0]);
    } else {
      setColor("");
    }

    if (user && initialProduct) {
      checkEligibility(initialProduct._id);
    }
  }, [initialProduct, initialRecommendations, slug, user, checkEligibility]);

  // Auto-change image in a loop every 5 seconds
  // Touch swipe gesture refs for mobile slider
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Fallbacks for display
  const displayPrice = product.price;
  const displayDiscountPrice = product.discountPrice ?? product.discountedPrice;
  const displayStock = inStock ? (product.stock ?? product.countInStock) : 0;
  const displayRatings = product.ratings ?? product.rating;
  const displayImages =
    product.images && product.images.length > 0
      ? product.images.filter((img): img is string => Boolean(img && img.trim()))
      : [product.image].filter((img): img is string => Boolean(img && img.trim()));

  const currentImageIndex = Math.max(0, displayImages.indexOf(selectedImage));

  const handlePrevImage = useCallback(() => {
    if (displayImages.length <= 1) return;
    setSelectedImage((curr) => {
      const idx = displayImages.indexOf(curr);
      const prevIdx = idx <= 0 ? displayImages.length - 1 : idx - 1;
      return displayImages[prevIdx];
    });
  }, [displayImages]);

  const handleNextImage = useCallback(() => {
    if (displayImages.length <= 1) return;
    setSelectedImage((curr) => {
      const idx = displayImages.indexOf(curr);
      const nextIdx = (idx + 1) % displayImages.length;
      return displayImages[nextIdx];
    });
  }, [displayImages]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 40;
    const isRightSwipe = distance < -40;

    if (isLeftSwipe) {
      handleNextImage();
    } else if (isRightSwipe) {
      handlePrevImage();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Auto-change image in a loop every 6 seconds when not interacting
  useEffect(() => {
    if (!product) return;
    if (displayImages.length <= 1 || lightboxImage || isZooming) return;

    const interval = setInterval(() => {
      handleNextImage();
    }, 6000);

    return () => clearInterval(interval);
  }, [product, lightboxImage, isZooming, displayImages.length, handleNextImage]);

  // Lock background scroll when lightbox or size guide is open
  useEffect(() => {
    if (lightboxImage || showSizeGuide) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightboxImage, showSizeGuide]);

  const variantOptions = getVariantOptions(
    product.variants,
    product.sizes,
    product.category,
    product.subCategory,
    product.title || product.name,
  );
  const sizesList = variantOptions.sizes;
  const colorsList = variantOptions.colors;
  const showColorSelector = colorsList.length > 0;

  // WhatsApp prefilled message
  const whatsappHelpMessage = `Hi GirlyHub team! I have a question about "${product.title}" (₹${displayDiscountPrice}). Can you please assist me?`;
  const productWhatsappUrl = `https://wa.me/918368422490?text=${encodeURIComponent(whatsappHelpMessage)}`;

  // Calculate review distribution
  const totalReviewsCount = product.reviews?.length || 0;
  const ratingDistribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 stars

  if (totalReviewsCount > 0 && product.reviews) {
    product.reviews.forEach((rev) => {
      const r = Math.round(rev.rating);
      if (r >= 1 && r <= 5) {
        ratingDistribution[5 - r] += 1;
      }
    });
  } else if (displayRatings > 0) {
    const roundedRating = Math.round(displayRatings);
    ratingDistribution[5 - roundedRating] = 3;
    if (roundedRating > 1) ratingDistribution[6 - roundedRating] = 1;
  }

  const distributionSum = ratingDistribution.reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="min-h-screen bg-[#FAF9F9] font-sans text-neutral-900">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Breadcrumbs */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 sm:mb-6 flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs md:text-sm text-neutral-500"
        >
          <BreadcrumbHome />
          <span className="text-neutral-300">/</span>
          <Link
            href={`/category/${encodeURIComponent(product.category)}`}
            className="capitalize hover:text-rose-600 transition-colors"
          >
            {product.category}
          </Link>
          <span className="text-neutral-300">/</span>
          <span className="font-semibold text-neutral-900 line-clamp-1">
            {product.title}
          </span>
        </nav>

        {/* Main product display */}
        <div className="grid grid-cols-1 gap-6 lg:gap-10 lg:grid-cols-12 mx-auto bg-white p-3 sm:p-5 md:p-7 rounded-2xl md:rounded-3xl border border-neutral-100 shadow-sm">
          {/* Left Section: Image Gallery */}
          <div className="lg:col-span-6 flex flex-col gap-3.5">
            {/* Main Display Image Container with touch slide & left/right controls */}
            <div
              className="relative w-full aspect-square overflow-hidden rounded-xl md:rounded-2xl bg-neutral-50/70 border border-neutral-100/80 group select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {product.discountPercentage > 0 && (
                <span className="absolute left-3 top-3 z-10 bg-neutral-900/90 backdrop-blur-xs px-2.5 py-1 text-[10px] font-bold text-white tracking-wider uppercase rounded-md shadow-xs">
                  {Math.floor(product.discountPercentage)}% Off
                </span>
              )}

              {/* Floating Action Buttons (Wishlist & Share) */}
              <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() =>
                    user ? addToWishlist(product._id) : router.push("/login")
                  }
                  aria-label={
                    user && alreadyInWishlist(product._id)
                      ? "In wishlist"
                      : "Add to wishlist"
                  }
                  className={`group/wishlist flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-white/95 backdrop-blur-xs shadow-sm transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer border ${
                    user && alreadyInWishlist(product._id)
                      ? "border-rose-300 bg-rose-50/80 hover:bg-rose-100 shadow-rose-200/50"
                      : "border-neutral-200/70 hover:border-rose-300 hover:bg-rose-50/50"
                  }`}
                >
                  {user && alreadyInWishlist(product._id) ? (
                    <Heart className="h-4.5 w-4.5 fill-rose-600 text-rose-600 transition-transform duration-200 group-hover/wishlist:scale-110" />
                  ) : (
                    <Heart className="h-4.5 w-4.5 text-neutral-400 group-hover/wishlist:text-rose-500 group-hover/wishlist:stroke-rose-500 transition-all duration-200" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share product"
                  className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-xs border border-neutral-200/60 shadow-sm transition-all hover:bg-white hover:scale-105 active:scale-95 cursor-pointer"
                  title="Share Product"
                >
                  <Share2 className="h-4.5 w-4.5 text-neutral-500 hover:text-neutral-900 transition-colors" />
                </button>
              </div>

              {/* Share feedback toast */}
              {shareSuccess && (
                <div className="absolute right-3 top-24 z-20 bg-neutral-900 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md shadow-md animate-pulse">
                  Link Copied!
                </div>
              )}

              {/* Left / Right slider navigation icons */}
              {displayImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    aria-label="Previous image"
                    className="absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-md backdrop-blur-xs border border-neutral-200/70 transition-all hover:bg-white hover:scale-105 active:scale-90 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 -ml-0.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    aria-label="Next image"
                    className="absolute right-2.5 sm:right-3.5 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/85 text-neutral-800 shadow-md backdrop-blur-xs border border-neutral-200/70 transition-all hover:bg-white hover:scale-105 active:scale-90 cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 -mr-0.5" />
                  </button>
                </>
              )}

              {/* Discreet Pagination Indicator Pill */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md text-[11px] font-medium text-white shadow-xs">
                  <span>{currentImageIndex + 1}</span>
                  <span className="opacity-60">/</span>
                  <span>{displayImages.length}</span>
                </div>
              )}

              {/* Magnifier glass zoom area / Full-width image display */}
              <div
                className="relative w-full h-full cursor-zoom-in flex items-center justify-center"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => setLightboxImage(selectedImage)}
              >
                {selectedImage ? (
                  <Image
                    src={selectedImage}
                    alt={product.title || "Product"}
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    className="object-contain transition-all duration-300"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs text-neutral-400">
                    No image available
                  </div>
                )}

                {/* Magnifier Lens Container (Desktop only) */}
                {!isMobile && selectedImage && (
                  <div
                    style={zoomStyle}
                    className="absolute inset-0 z-20 pointer-events-none border border-neutral-200 bg-white"
                  />
                )}
              </div>
            </div>

            {/* Thumbnails list */}
            {displayImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto scrollbar-none py-1 justify-start">
                {displayImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-neutral-100 transition-all duration-200 shrink-0 cursor-pointer ${
                      selectedImage === img
                        ? "border-2 border-neutral-900 shadow-sm opacity-100 scale-[1.02]"
                        : "border border-neutral-200/80 opacity-60 hover:opacity-95 hover:border-neutral-400"
                    }`}
                    onClick={() => setSelectedImage(img)}
                  >
                    <Image
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Section: Details & Purchase actions */}
          <div
            ref={buySectionRef}
            className="lg:col-span-6 flex flex-col space-y-5 sm:space-y-6 justify-start"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 text-xs font-semibold uppercase tracking-wider border border-rose-100">
                  <Sparkles className="size-3 text-rose-500" />
                  {product.category}
                </span>
                <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80" />
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight tracking-tight text-neutral-900">
                {product.title}
              </h1>

              {/* Rating Stars average */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(displayRatings)
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
                <span
                  className="text-xs text-neutral-500 font-medium cursor-pointer hover:underline"
                  onClick={() => {
                    const el = document.getElementById("reviews-section");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {product.reviews?.length || 0} reviews
                </span>
              </div>

              {/* Price display with responsive layout that never overflows on phone */}
              <div className="flex flex-col gap-3 py-3 border-y border-neutral-100/90">
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50/80 border border-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-900">
                  <TrendingDown className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Lowest price in last 30 days</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight">
                      ₹{displayDiscountPrice.toLocaleString()}
                    </span>
                    {displayPrice > displayDiscountPrice && (
                      <>
                        <span className="text-base sm:text-lg text-neutral-400 line-through font-medium">
                          ₹{displayPrice.toLocaleString()}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-0.5 whitespace-nowrap">
                          Save ₹
                          {(displayPrice - displayDiscountPrice).toLocaleString()}{" "}
                          ({Math.floor(product.discountPercentage)}% OFF)
                        </span>
                      </>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between sm:justify-end gap-2.5 self-stretch sm:self-auto pt-1 sm:pt-0">
                    <span className="text-xs font-semibold text-neutral-500 sm:hidden">
                      Quantity:
                    </span>
                    <div className="flex h-10 shrink-0 items-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 shadow-xs">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        disabled={quantity <= 1}
                        onClick={() =>
                          setQuantity((current) => Math.max(1, current - 1))
                        }
                        className="flex h-full w-9 items-center justify-center text-base font-semibold text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200 disabled:cursor-not-allowed disabled:text-neutral-300"
                      >
                        −
                      </button>
                      <span className="flex h-full w-9 items-center justify-center text-xs sm:text-sm font-bold text-neutral-900">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        disabled={quantity >= displayStock}
                        onClick={() =>
                          setQuantity((current) =>
                            Math.min(displayStock, current + 1),
                          )
                        }
                        className="flex h-full w-9 items-center justify-center text-base font-semibold text-neutral-700 transition hover:bg-neutral-100 active:bg-neutral-200 disabled:cursor-not-allowed disabled:text-neutral-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 font-medium">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Conversion Boosters: Active Viewers & Stock Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 bg-amber-50/70 border border-amber-100/60 rounded-xl px-3 py-2.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                  <span>🔥 {activeViewers} people viewing this now</span>
                </div>

                {displayStock > 0 && displayStock <= 5 ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                    <span>Hurry! Only {displayStock} left in stock</span>
                  </div>
                ) : displayStock > 5 ? (
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/60 border border-emerald-100/40 rounded-xl px-3 py-2.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>In Stock - Ships within 24 hours</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 bg-rose-50/60 border border-rose-100/45 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Currently Out of Stock</span>
                  </div>
                )}
              </div>

              {product.material && (
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-800 bg-pink-50/40 border border-pink-100/60 rounded-xl px-3.5 py-2">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="text-neutral-500 font-medium">Material:</span>
                  <span className="text-neutral-900 font-bold capitalize">{product.material}</span>
                </div>
              )}

              <p className="text-sm leading-relaxed text-neutral-600">
                {product.shortDescription || product.description}
              </p>

              {/* Sizes variants */}
              {sizesList.length > 0 && (
                <div className="space-y-2.5 py-2.5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Select Size:
                      </span>
                      <span className="text-xs font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                        {size || sizesList[0]}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSizeGuide(true)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 underline underline-offset-2 transition-all cursor-pointer"
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      <span>Size Guide</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {sizesList.map((s) => {
                      const isSelected = s === size;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSize(s)}
                          className={`min-w-[48px] h-[40px] px-3.5 rounded-xl text-xs font-bold tracking-wide border transition-all cursor-pointer select-none flex items-center justify-center gap-1 ${
                            isSelected
                              ? "bg-[#db4d79] text-white border-[#db4d79] shadow-md shadow-pink-200 ring-2 ring-pink-200 scale-[1.03]"
                              : "bg-white text-neutral-700 border-neutral-200 hover:border-[#db4d79] hover:text-[#db4d79] hover:bg-pink-50/40"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
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
                          className={`relative w-8 h-8 rounded-full border-2 transition-all p-0.5 ${
                            colName === color
                              ? "border-[#db4d79] scale-110 shadow-sm ring-2 ring-pink-100"
                              : "border-transparent hover:scale-105"
                          }`}
                        >
                          <div
                            style={{ backgroundColor: cleanColor }}
                            className="w-full h-full rounded-full shadow-inner border border-black/5 flex items-center justify-center"
                          >
                            {colName === color && (
                              <Check className="w-3 h-3 text-white mix-blend-difference" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-4 pt-2">
              {/* Delivery estimate */}
              <div className="flex items-center gap-3 border border-neutral-200/80 bg-neutral-50 px-4 py-3 rounded-xl">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white border border-neutral-200 text-neutral-700 shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-neutral-800">
                    Order today, get it by{" "}
                    <span className="text-neutral-950 font-bold">
                      {formattedDeliveryDate}
                    </span>
                  </p>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    Estimated 5-day delivery to your address
                  </p>
                </div>
              </div>

              {displayStock <= 0 ? (
                <button
                  disabled
                  className="w-full h-12 text-center bg-neutral-100 border border-neutral-200 text-neutral-400 font-bold uppercase tracking-wider cursor-not-allowed text-sm rounded-xl"
                >
                  Out of Stock
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    disabled={addingCart}
                    onClick={() => addToCart(true)}
                    className="relative w-full sm:flex-1 h-12 overflow-hidden flex items-center justify-center gap-2 rounded-xl bg-rose-600 text-white font-bold text-xs tracking-wider uppercase hover:bg-rose-700 transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-98"
                  >
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent [animation:button-shine_1.8s_ease-in-out_infinite]"
                    />
                    Buy Now
                  </button>
                  <button
                    disabled={addingCart}
                    onClick={() => addToCart(false)}
                    className="w-full sm:flex-1 h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-xs tracking-wider uppercase transition-all disabled:opacity-50 border-2 border-[#db4d79] bg-white text-[#db4d79] hover:bg-pink-50 hover:border-[#c23b65] hover:text-[#c23b65] cursor-pointer active:scale-98 shadow-xs"
                  >
                    <ShoppingCart className="w-4 h-4" /> Add to Bag
                  </button>
                </div>
              )}

              {/* Catchy & Professional WhatsApp DM / Stylist Support Card */}
              <div className="rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-emerald-50/60 p-4 sm:p-5 shadow-xs transition-all hover:border-emerald-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-md shadow-emerald-600/20">
                      <FaWhatsapp className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-950">
                          GirlyHub Stylist Support
                        </span>
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                        </span>
                      </div>
                      <p className="text-sm font-bold text-neutral-900">
                        Have an issue or want to ask anything?
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-neutral-600">
                  Need sizing advice, photo confirmation, styling tips, or having an issue with your order? You can just DM us on WhatsApp for instant 1-on-1 assistance!
                </p>

                <div className="mt-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <a
                    href={productWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#20bd5a] hover:shadow-md active:scale-98"
                  >
                    <FaWhatsapp className="h-4 w-4" />
                    <span>DM Us on WhatsApp</span>
                  </a>
                  <span className="text-[11px] font-semibold text-emerald-800 text-center sm:text-right">
                    ⚡ Usually replies in &lt; 5 mins
                  </span>
                </div>
              </div>

              {/* Secure Payments stripe */}
              {displayStock > 0 && (
                <div className="pt-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                    100% Secure Checkout
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-3 opacity-60">
                    {/* Mastercard SVG */}
                    <svg
                      className="h-4.5 w-auto"
                      viewBox="0 0 24 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle cx="7.5" cy="9" r="6" fill="#F97316" />
                      <circle cx="16.5" cy="9" r="6" fill="#EF4444" />
                    </svg>
                    <span className="text-[9px] font-extrabold text-neutral-800 border border-neutral-300 px-1 py-0.2 tracking-wider">
                      RUPAY
                    </span>
                    <span
                      aria-label="UPI"
                      title="UPI"
                      className="inline-flex items-center justify-center border border-neutral-300 p-1 text-neutral-800"
                    >
                      <SiGooglepay className="h-3.5 w-7" aria-hidden="true" />
                    </span>
                    <span
                      aria-label="Paytm"
                      title="Paytm"
                      className="inline-flex items-center justify-center border border-[#b7d7ff] p-1 text-[#007bff]"
                    >
                      <SiPaytm className="h-3.5 w-8" aria-hidden="true" />
                    </span>
                  </div>
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
      <div className="my-6 mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-4 bg-white border border-neutral-100 p-5 rounded-2xl">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-100">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-800">
              Free Shipping
            </h4>
            <p className="text-xs text-neutral-400 font-medium">
              On all orders above ₹399
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white border border-neutral-100 p-5 rounded-2xl ">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-100">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-800">Easy Returns</h4>
            <p className="text-xs text-neutral-400 font-medium">
              7-day replacement guarantee
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white border border-neutral-100 p-5 rounded-2xl ">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-50 text-neutral-700 border border-neutral-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-800">
              Secure Checkout
            </h4>
            <p className="text-xs text-neutral-400 font-medium">
              100% protected safe payments
            </p>
          </div>
        </div>
      </div>

      {/* Product Specifications Section Accordion */}
      <div className="mx-auto bg-white border border-neutral-100 p-6 md:p-8 mb-10">
        <div className="divide-y divide-neutral-200">
          {/* Description Accordion */}
          <div className="pb-4">
            <button
              onClick={() =>
                setOpenAccordions((prev) => ({ ...prev, desc: !prev.desc }))
              }
              className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-neutral-800 focus:outline-none cursor-pointer"
            >
              <span>Description</span>
              <span className="text-neutral-500 font-bold text-sm">
                {openAccordions.desc ? "–" : "+"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {openAccordions.desc && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 text-xs md:text-sm text-neutral-600 leading-relaxed font-sans">
                    <pre className="overflow-auto whitespace-pre-wrap break-words font-sans">
                      {product.longDescription || product.description || product.info}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Specifications Accordion */}
          <div className="py-4">
            <button
              onClick={() =>
                setOpenAccordions((prev) => ({
                  ...prev,
                  details: !prev.details,
                }))
              }
              className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-neutral-800 focus:outline-none cursor-pointer"
            >
              <span>Specifications & Details</span>
              <span className="text-neutral-500 font-bold text-sm">
                {openAccordions.details ? "–" : "+"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {openAccordions.details && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 text-xs md:text-sm text-neutral-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 font-sans">
                      <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100">
                        <span className="font-semibold text-neutral-400">
                          Category
                        </span>
                        <span className="text-neutral-800">
                          {product.category}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100">
                        <span className="font-semibold text-neutral-400">
                          Stock Status
                        </span>
                        <span
                          className={
                            displayStock > 0
                              ? "text-emerald-700 font-semibold"
                              : "text-rose-700 font-semibold"
                          }
                        >
                          {displayStock > 0
                            ? `In Stock (${displayStock} units)`
                            : "Out of Stock"}
                        </span>
                      </div>
                      {product.material && (
                        <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100">
                          <span className="font-semibold text-neutral-400">
                            Material
                          </span>
                          <span className="text-neutral-800 font-semibold capitalize">
                            {product.material}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100">
                        <span className="font-semibold text-neutral-400">
                          Weight
                        </span>
                        <span className="text-neutral-800">
                          {product.weight ? `${product.weight} kg` : "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 py-1.5 border-b border-neutral-100">
                        <span className="font-semibold text-neutral-400">
                          Dimensions
                        </span>
                        <span className="text-neutral-800">
                          {product.length || product.breadth || product.height
                            ? `${product.length || "-"} x ${product.breadth || "-"} x ${product.height || "-"} cm`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Shipping & Returns Accordion */}
          <div className="pt-4">
            <button
              onClick={() =>
                setOpenAccordions((prev) => ({
                  ...prev,
                  shipping: !prev.shipping,
                }))
              }
              className="w-full flex items-center justify-between text-left font-bold text-xs uppercase tracking-wider text-neutral-800 focus:outline-none cursor-pointer"
            >
              <span>Shipping & Return Policies</span>
              <span className="text-neutral-500 font-bold text-sm">
                {openAccordions.shipping ? "–" : "+"}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {openAccordions.shipping && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 text-xs md:text-sm text-neutral-600 leading-relaxed font-sans space-y-2">
                    <p>
                      📦 <strong>Free Shipping:</strong> Enjoy free standard
                      shipping on all orders above ₹399. Orders below ₹399 have a standard delivery fee of ₹29. Orders are shipped
                      within 24-48 hours.
                    </p>
                    <p>
                      🔄 <strong>7-Day Returns:</strong> If you are not
                      completely satisfied, return or replace your product
                      within 7 days of delivery. Terms & conditions apply.
                    </p>
                    <p>
                      🛡️ <strong>Secure Checkout:</strong> All transactions are
                      encrypted and processed securely. We accept COD, UPI,
                      Cards, and NetBanking.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* REVIEWS SECTION */}
      <div
        id="reviews-section"
        className=" mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12"
      >
        {/* Write a Review Block */}
        <div className="lg:col-span-4 bg-white p-6 border border-neutral-100 flex flex-col justify-start">
          <h2 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
            Ratings & Reviews
          </h2>

          <div className="flex items-center gap-4 mb-4">
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
              <p className="text-[11px] font-semibold text-neutral-400">
                Based on {product.reviews?.length || 0} reviews
              </p>
            </div>
          </div>

          {/* Rating Distribution Bars */}
          <div className="space-y-2 mb-6 border-t border-neutral-100 pt-4">
            {ratingDistribution.map((count, index) => {
              const stars = 5 - index;
              const percentage = Math.round((count / distributionSum) * 100);
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 text-neutral-500 font-semibold">
                    {stars} ★
                  </span>
                  <div className="flex-1 h-2 bg-neutral-100 overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-neutral-900 transition-all duration-500"
                    />
                  </div>
                  <span className="w-8 text-right text-neutral-400 font-semibold">
                    {percentage}%
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-neutral-100 pt-4">
            {reviewEligible ? (
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <span className="text-xs font-bold text-neutral-800 block uppercase tracking-wider">
                  Post a Review
                </span>

                {/* Stars selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Star Rating
                  </label>
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
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    Your Comments
                  </label>
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
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50"
                      >
                        <Image
                          src={url}
                          alt="Review Preview"
                          fill
                          className="object-cover"
                        />
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
                        <span className="text-[9px] font-semibold text-neutral-400 mt-1">
                          Add Photo
                        </span>
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
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />{" "}
                    {reviewError}
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
                  Only customers who have purchased and received this product
                  are verified to write reviews.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Existing reviews list */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-neutral-100 ">
          <h2 className="text-lg font-bold text-neutral-800 mb-6 flex items-center gap-2">
            Verified Reviews ({product.reviews?.length || 0})
          </h2>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-none">
            {product.reviews && product.reviews.length > 0 ? (
              product.reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="border-b border-neutral-100 pb-6 last:border-b-0 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center font-bold text-xs uppercase border border-neutral-200">
                        {rev.username.charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-neutral-800">
                          {rev.username}
                        </h4>
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
                          <Image
                            src={photoUrl}
                            alt="Customer Photo"
                            fill
                            className="object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 space-y-2">
                <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto" />
                <p className="text-xs font-semibold text-neutral-400">
                  No reviews yet for this product.
                </p>
                <p className="text-[10px] text-neutral-300">
                  Be the first to purchase and review!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar products section */}
      <div className=" mx-auto my-12">
        <h2 className="text-lg md:text-xl font-bold text-neutral-800 mb-6 flex items-center gap-2">
          You May Also Like{" "}
          <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
        </h2>
        <div className="my-4 grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {similarProducts.length > 0 ? (
            similarProducts.map((p) => <ProductCard key={p._id} product={p} />)
          ) : (
            <p className="col-span-full text-center text-neutral-400 py-6 text-xs">
              No related products found.
            </p>
          )}
        </div>
      </div>

      {recentlyViewedProducts.length > 0 && (
        <div className="mx-auto my-12">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-neutral-800 md:text-xl">
            Recently viewed <Clock3 className="size-4 text-rose-500" />
          </h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {recentlyViewedProducts.map((recentProduct) => (
              <ProductCard key={recentProduct._id} product={recentProduct} />
            ))}
          </div>
        </div>
      )}

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
              className="relative max-h-full max-w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={lightboxImage}
                alt="Fullscreen Customer View"
                className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl"
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

      {/* Size Guide Modal Overlay */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSizeGuide(false)}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-lg p-6 rounded-2xl border border-neutral-200 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-700 transition-colors p-1.5 rounded-lg hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600">
                  <Ruler className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 uppercase tracking-wide">
                  Bangles &amp; Bracelet Size Guide
                </h3>
              </div>
              <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                Standard Indian bangle measurements (inner diameter &amp; wrist circumference). Measure an existing bangle or your hand knuckles to choose the perfect fit.
              </p>

              {/* Bangle Sizing Chart Table */}
              <div className="overflow-x-auto rounded-xl border border-neutral-200/90 mb-4">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50/90 border-b border-neutral-200 font-bold uppercase tracking-wider text-neutral-600 text-[11px]">
                      <th className="p-2.5">Indian Size</th>
                      <th className="p-2.5">Inner Diameter</th>
                      <th className="p-2.5">Circumference</th>
                      <th className="p-2.5">Fit / Type</th>
                    </tr>
                  </thead>
                  <tbody className="text-neutral-700 divide-y divide-neutral-100">
                    {BANGLE_SIZE_CHART.map((b) => (
                      <tr
                        key={b.size}
                        className={b.size === size ? "bg-rose-50/60 font-semibold" : "hover:bg-neutral-50/50"}
                      >
                        <td className="p-2.5 font-bold text-neutral-900">
                          {b.size}
                          {b.size === size && (
                            <span className="ml-1.5 text-[10px] text-rose-600 font-extrabold">(Selected)</span>
                          )}
                        </td>
                        <td className="p-2.5 text-neutral-700">
                          {b.diameterIn} <span className="text-neutral-400">({b.diameterMm})</span>
                        </td>
                        <td className="p-2.5 text-neutral-600">{b.wrist}</td>
                        <td className="p-2.5 text-neutral-500 text-[11px]">{b.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* How to measure helper tips */}
              <div className="space-y-2 rounded-xl bg-neutral-50 p-3.5 border border-neutral-200/70 text-xs text-neutral-600">
                <div className="flex items-center gap-1.5 font-bold text-neutral-900">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>How to measure your bangle size:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-600 leading-relaxed pl-1">
                  <li><strong>Method 1:</strong> Take an existing well-fitting bangle and measure its inside diameter in inches using a ruler.</li>
                  <li><strong>Method 2:</strong> Bring your thumb and little finger together as if putting on a bangle, then wrap a string or measuring tape around the widest part of your knuckles.</li>
                  <li>If you are between two sizes, we recommend choosing the <strong>larger size</strong> for comfortable sliding over the hand.</li>
                </ol>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>

      {/* Sticky Mobile Action Bar */}
      <AnimatePresence>
        {showStickyBar && displayStock > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white/95 backdrop-blur-md border-t border-neutral-200/80 px-4 py-3 shadow-2xl flex items-center gap-3"
          >
            <div className="flex flex-col min-w-[70px]">
              <span className="text-[10px] uppercase font-bold text-neutral-400">Total</span>
              <span className="text-base font-extrabold text-neutral-900 tracking-tight">
                ₹{(displayDiscountPrice * quantity).toLocaleString()}
              </span>
            </div>
            <button
              disabled={addingCart}
              onClick={() => addToCart(false)}
              className="relative flex-1 overflow-hidden rounded-xl bg-rose-600 px-4 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-rose-700 disabled:opacity-50 active:scale-[0.99]"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent [animation:button-shine_1.8s_ease-in-out_infinite]"
              />
              {addingCart ? "Adding..." : "Add to Bag"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductPageClient;
