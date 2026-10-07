"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Smartphone,
} from "lucide-react";
import {
  FaWhatsapp,
  FaTelegramPlane,
  FaFacebookF,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

export interface ShareProductData {
  _id?: string;
  title: string;
  name?: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  price: number;
  discountPrice?: number;
  discountedPrice?: number;
  discountPercentage?: number;
  image?: string;
  images?: string[];
  category?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ShareProductData;
  url?: string;
}

/**
 * Extracts a clean, marketing-ready 1-2 sentence hook from markdown/HTML text.
 * Strips markdown headers (##), bold (**), dividers (---), list markers, etc.
 */
export function extractCleanSnippet(
  description?: string,
  shortDescription?: string
): string {
  if (shortDescription) {
    const clean = shortDescription
      .replace(/<[^>]*>/g, "")
      .replace(/[*#_`-]/g, "")
      .trim();
    if (clean.length > 20) {
      return clean.length > 130 ? clean.slice(0, 127).trim() + "..." : clean;
    }
  }

  if (!description) return "";

  const lines = description.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();

    // Skip markdown headings, dividers, list items, blockquotes
    if (
      !line ||
      line.startsWith("#") ||
      line.startsWith("---") ||
      line.startsWith("===") ||
      line.startsWith("-") ||
      line.startsWith("*") ||
      line.startsWith("•") ||
      line.startsWith(">")
    ) {
      continue;
    }

    // Skip section headers that lack markdown hashes
    if (
      line.toLowerCase().includes("key highlight") ||
      line.toLowerCase().includes("product specification") ||
      line.toLowerCase().includes("care instruction") ||
      line.toLowerCase().includes("styling tip")
    ) {
      continue;
    }

    const cleaned = line
      .replace(/<[^>]*>/g, "")
      .replace(/[*_`#]/g, "")
      .trim();

    if (cleaned.length >= 25) {
      return cleaned.length > 130 ? cleaned.slice(0, 127).trim() + "..." : cleaned;
    }
  }

  return "";
}

/**
 * Builds clean enterprise share payloads for native share, WhatsApp, and clipboard.
 */
export function getEnterpriseSharePayloads(
  product: ShareProductData,
  productUrl: string
) {
  const title = product.title || product.name || "GirlyHub Product";
  const hook = extractCleanSnippet(product.description, product.shortDescription);

  const activePrice =
    product.discountPrice || product.discountedPrice || product.price;
  const originalPrice = product.price > activePrice ? product.price : null;

  const priceText = activePrice ? `₹${activePrice.toLocaleString("en-IN")}` : "";
  const discountText =
    originalPrice && (product.discountPercentage || 0) > 0
      ? ` (${product.discountPercentage}% OFF)`
      : "";

  // 1. WhatsApp formatted message (uses WhatsApp bold syntax `*...*`)
  const whatsappLines = [
    `✨ *${title}* | GirlyHub`,
    hook ? `🌸 ${hook}` : "",
    priceText ? `🏷️ Price: *${priceText}*${discountText}` : "",
    `🚚 Fast Pan-India Delivery • 100% Genuine Quality`,
    `🛍️ Tap to view & buy:`,
    productUrl,
  ].filter(Boolean);

  const whatsappMessage = whatsappLines.join("\n");

  // 2. Native Web Share API text (does not repeat URL since `url` is passed separately)
  const nativeLines = [
    `✨ ${title} on GirlyHub`,
    hook ? `🌸 ${hook}` : "",
    priceText ? `🏷️ Price: ${priceText}${discountText}` : "",
    `🚚 Fast Pan-India Delivery • 100% Genuine Quality`,
  ].filter(Boolean);

  const nativeText = nativeLines.join("\n");

  return {
    title: `${title} | GirlyHub`,
    hook,
    activePrice,
    originalPrice,
    priceText,
    discountText,
    whatsappMessage,
    nativeText,
    url: productUrl,
  };
}

export default function ShareModal({
  isOpen,
  onClose,
  product,
  url,
}: ShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Compute canonical URL
  const shareUrl =
    url ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/product/${product.slug || ""}`
      : `https://www.girlyhub.in/product/${product.slug || ""}`);

  const shareData = getEnterpriseSharePayloads(product, shareUrl);

  const productImage =
    (product.images && product.images[0]) ||
    product.image ||
    "/placeholder.png";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(shareData.whatsappMessage);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2200);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const handleWhatsApp = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
      shareData.whatsappMessage
    )}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  const handleTelegram = () => {
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(
      shareUrl
    )}&text=${encodeURIComponent(shareData.nativeText)}`;
    window.open(tgUrl, "_blank", "noopener,noreferrer");
  };

  const handleTwitter = () => {
    const tweetText = `✨ Check out ${product.title} on GirlyHub!`;
    const twUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      tweetText
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twUrl, "_blank", "noopener,noreferrer");
  };

  const handleFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(fbUrl, "_blank", "noopener,noreferrer");
  };

  const handleDeviceShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.nativeText,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Native share failed:", err);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const hasNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.96 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full sm:max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl border border-rose-100 bg-white p-5 sm:p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-modal-title"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-rose-100/70">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-[#8a2a44]">
                  <Share2 className="h-4 w-4" />
                </div>
                <div>
                  <h3
                    id="share-modal-title"
                    className="font-cormorant text-lg sm:text-xl font-semibold text-[#4e1a27] leading-tight"
                  >
                    Share this Piece 💖
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-sans">
                    Send to friends or share with your styling circle
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Product Card Preview */}
            <div className="mt-4 flex items-center gap-3.5 rounded-2xl border border-rose-100/80 bg-gradient-to-r from-rose-50/50 via-pink-50/30 to-rose-50/50 p-3 shadow-2xs">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white border border-rose-100/60 shadow-2xs">
                <Image
                  src={productImage}
                  alt={product.title}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                {product.category && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8a3348]">
                    {product.category}
                  </span>
                )}
                <h4 className="text-xs font-semibold text-[#4e1a27] line-clamp-1">
                  {product.title}
                </h4>

                <div className="mt-1 flex items-baseline gap-2">
                  <span className="font-mono text-sm font-bold text-[#531828]">
                    {shareData.priceText}
                  </span>
                  {shareData.originalPrice && (
                    <span className="font-mono text-[11px] text-neutral-400 line-through">
                      ₹{shareData.originalPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  {shareData.discountText && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      {shareData.discountText.replace(/[()]/g, "")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Primary Action: Direct WhatsApp Button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleWhatsApp}
                className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-[#20bd5a] hover:shadow-lg active:scale-98 cursor-pointer"
              >
                <FaWhatsapp className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span>Share on WhatsApp</span>
              </button>
            </div>

            {/* Quick Channels Grid */}
            <div className="mt-3 grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleTelegram}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-neutral-200/80 bg-white p-2.5 text-neutral-700 transition-all hover:border-sky-300 hover:bg-sky-50/50 hover:text-sky-600 active:scale-95 cursor-pointer"
                title="Share on Telegram"
              >
                <FaTelegramPlane className="h-4.5 w-4.5 text-[#0088cc]" />
                <span className="text-[10px] font-medium">Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleTwitter}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-neutral-200/80 bg-white p-2.5 text-neutral-700 transition-all hover:border-neutral-400 hover:bg-neutral-50 active:scale-95 cursor-pointer"
                title="Share on X"
              >
                <FaXTwitter className="h-4.5 w-4.5 text-neutral-900" />
                <span className="text-[10px] font-medium">X (Twitter)</span>
              </button>

              <button
                type="button"
                onClick={handleFacebook}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-neutral-200/80 bg-white p-2.5 text-neutral-700 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-600 active:scale-95 cursor-pointer"
                title="Share on Facebook"
              >
                <FaFacebookF className="h-4.5 w-4.5 text-[#1877f2]" />
                <span className="text-[10px] font-medium">Facebook</span>
              </button>

              <button
                type="button"
                onClick={handleDeviceShare}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-neutral-200/80 bg-white p-2.5 text-neutral-700 transition-all hover:border-pink-300 hover:bg-pink-50/50 hover:text-pink-600 active:scale-95 cursor-pointer"
                title="Share via device options"
              >
                <Smartphone className="h-4.5 w-4.5 text-[#8a3348]" />
                <span className="text-[10px] font-medium">
                  {hasNativeShare ? "Device" : "More"}
                </span>
              </button>
            </div>

            {/* Copy Link Input Row */}
            <div className="mt-4">
              <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                Product Link
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-1.5 focus-within:border-pink-400 focus-within:ring-2 focus-within:ring-pink-100 transition-all">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-transparent px-2 text-xs text-neutral-700 outline-none select-all font-mono"
                  aria-label="Product link URL"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1 rounded-lg bg-[#531828] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#6c2336] active:scale-95 cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Copy Formatted Text Option */}
            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-neutral-100 text-[11px]">
              <span className="text-neutral-500">Need full message with details?</span>
              <button
                type="button"
                onClick={handleCopyMessage}
                className="font-semibold text-[#8a3348] hover:text-[#531828] underline underline-offset-2 transition-colors cursor-pointer flex items-center gap-1"
              >
                {copiedMessage ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Message Copied!</span>
                  </>
                ) : (
                  <span>Copy Formatted Text</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
