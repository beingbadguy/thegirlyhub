"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Instagram,
  ArrowUpRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Share2,
  Eye,
  Check,
} from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";
import type { SSRReel } from "@/lib/ssrData";
import { useAuthStore } from "@/store/store";

interface InstagramShowcaseProps {
  initialReels?: SSRReel[];
}

// Fallback high-quality demo reels if none added in DB yet
const DEFAULT_DEMO_REELS: SSRReel[] = [
  {
    _id: "demo-1",
    title: "✨ Korean Bow Claw Clip Style Tutorial",
    description: "Effortless French twist styling in 10 seconds with our bestselling crystal bow claw clip.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    duration: 8,
    aspectRatio: "9:16",
    productTitle: "Korean Pearl Bow Claw Clip",
    productPrice: 249,
    productImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    productSlug: "korean-pearl-bow-claw-clip",
    likesCount: 1420,
    viewsCount: 8900,
  },
  {
    _id: "demo-2",
    title: "💎 Anti-Tarnish Waterproof Dainty Necklace",
    description: "Daily wear 18k gold plated clover pendant tested under water and perfume.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80",
    duration: 10,
    aspectRatio: "9:16",
    productTitle: "18k Dainty Clover Necklace",
    productPrice: 399,
    productImage: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=200&q=80",
    productSlug: "18k-dainty-clover-necklace",
    likesCount: 2310,
    viewsCount: 14500,
  },
  {
    _id: "demo-3",
    title: "🌸 Satin Silk Scrunchie Hair Care Routine",
    description: "Zero breakage, maximum volume. Mulberry silk finish for healthy curls.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
    duration: 7,
    aspectRatio: "9:16",
    productTitle: "Jumbo Mulberry Silk Scrunchie",
    productPrice: 199,
    productImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
    productSlug: "jumbo-mulberry-silk-scrunchie",
    likesCount: 980,
    viewsCount: 6200,
  },
  {
    _id: "demo-4",
    title: "💫 Minimalist Huggie Hoops Stacking Inspo",
    description: "Hypoallergenic titanium post huggies for sensitive ears. Wear 24/7.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=600&q=80",
    duration: 9,
    aspectRatio: "9:16",
    productTitle: "Zirconia Pave Huggie Hoops",
    productPrice: 299,
    productImage: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=200&q=80",
    productSlug: "zirconia-pave-huggie-hoops",
    likesCount: 1840,
    viewsCount: 11200,
  },
];

export default function InstagramShowcase({
  initialReels,
}: InstagramShowcaseProps) {
  const [reels, setReels] = useState<SSRReel[]>(
    Array.isArray(initialReels) && initialReels.length > 0
      ? initialReels
      : DEFAULT_DEMO_REELS,
  );
  const [activeModalReel, setActiveModalReel] = useState<SSRReel | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [hoveredReelId, setHoveredReelId] = useState<string | null>(null);
  const [likedReelIds, setLikedReelIds] = useState<Set<string>>(new Set());
  const [copiedShare, setCopiedShare] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  // Client fetch if no initial reels provided
  useEffect(() => {
    if (Array.isArray(initialReels) && initialReels.length > 0) return;

    let active = true;
    fetch("/api/reels")
      .then((res) => res.json())
      .then((data) => {
        if (active && data.success && Array.isArray(data.reels) && data.reels.length > 0) {
          setReels(data.reels);
        }
      })
      .catch(() => {
        // Keep demo reels on error
      });

    return () => {
      active = false;
    };
  }, [initialReels]);

  // Handle play / pause on hover for carousel video cards
  useEffect(() => {
    videoRefs.current.forEach((video, id) => {
      if (!video) return;
      if (id === hoveredReelId) {
        video.muted = isMuted;
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [hoveredReelId, isMuted]);

  // Sync mute state to modal video
  useEffect(() => {
    if (modalVideoRef.current) {
      modalVideoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const scrollCarousel = (direction: "left" | "right") => {
    if (!carouselRef.current) return;
    const scrollAmount = direction === "left" ? -320 : 320;
    carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const handleLike = async (e: React.MouseEvent, reel: SSRReel) => {
    e.stopPropagation();
    if (likedReelIds.has(reel._id)) return;

    setLikedReelIds((prev) => new Set(prev).add(reel._id));
    setReels((prev) =>
      prev.map((r) =>
        r._id === reel._id ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r,
      ),
    );

    try {
      await fetch(`/api/reels/${reel._id}/like`, { method: "POST" });
    } catch {
      // Optimistic update retained
    }
  };

  const openReelModal = (reel: SSRReel) => {
    setActiveModalReel(reel);
    // Track view count
    fetch(`/api/reels/${reel._id}/view`, { method: "POST" }).catch(() => {});
  };

  const nextReel = () => {
    if (!activeModalReel) return;
    const currentIndex = reels.findIndex((r) => r._id === activeModalReel._id);
    const nextIndex = (currentIndex + 1) % reels.length;
    setActiveModalReel(reels[nextIndex]);
  };

  const prevReel = () => {
    if (!activeModalReel) return;
    const currentIndex = reels.findIndex((r) => r._id === activeModalReel._id);
    const prevIndex = (currentIndex - 1 + reels.length) % reels.length;
    setActiveModalReel(reels[prevIndex]);
  };

  const copyShareLink = () => {
    if (typeof window === "undefined") return;
    navigator.clipboard.writeText(window.location.origin + "/#reels");
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <section id="reels" className="relative overflow-hidden px-4 py-12 sm:px-8 sm:py-16 md:px-12 lg:px-16 bg-[#fcf9f5] rounded-3xl my-8 border border-[#ebe4da]/80 shadow-xs">
      {/* Background ambient pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e8ddd0_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Background floral accents */}
      <div className="pointer-events-none absolute -bottom-8 -right-8 opacity-25 select-none">
        <FloralAccent flower={1} size="xl" variant="float" />
      </div>
      <div className="pointer-events-none absolute -top-8 -left-8 opacity-20 select-none">
        <FloralAccent flower={3} size="lg" variant="sway" />
      </div>

      <div className="relative max-w-7xl mx-auto z-10">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-6 border-b border-[#ded8cc]/70 pb-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200/80 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-rose-700 shadow-2xs mb-3">
              <Instagram className="size-3.5 text-rose-600" />
              <span>@OFFICIALGIRLYHUB</span>
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-3xl sm:text-4xl font-semibold leading-tight tracking-tight font-serif text-[#3e1b24]">
                Watch &amp; Shop Trending Reels
              </h2>
              <FloralAccent
                flower={2}
                size="sm"
                variant="sway"
                className="opacity-80"
              />
            </div>

            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Short styling tips, unboxings, and water-resistance tests. Click any reel to shop the exact piece.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Carousel navigation buttons */}
            <div className="hidden sm:flex items-center gap-1.5 mr-2">
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                aria-label="Scroll reels left"
                className="grid size-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-2xs hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                aria-label="Scroll reels right"
                className="grid size-9 place-items-center rounded-full border border-neutral-300 bg-white text-neutral-700 shadow-2xs hover:bg-neutral-50 active:scale-95 transition cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <a
              href="https://www.instagram.com/officialgirlyhub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-rose-900 shadow-xs hover:border-rose-300 hover:bg-rose-50 transition duration-200 cursor-pointer"
            >
              <Instagram size={16} className="text-rose-600" />
              <span>Follow on Instagram</span>
              <ArrowUpRight size={14} className="text-neutral-400" />
            </a>
          </div>
        </div>

        {/* REELS CAROUSEL STRIP */}
        <div
          ref={carouselRef}
          className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {reels.map((reel) => {
            const isHovered = hoveredReelId === reel._id;
            const isLiked = likedReelIds.has(reel._id);

            return (
              <div
                key={reel._id}
                onMouseEnter={() => setHoveredReelId(reel._id)}
                onMouseLeave={() => setHoveredReelId(null)}
                onClick={() => openReelModal(reel)}
                className="group relative shrink-0 snap-start cursor-pointer w-[210px] sm:w-[240px] md:w-[260px] aspect-[9/16] rounded-2xl sm:rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 select-none bg-neutral-900 ring-1 ring-black/5 hover:-translate-y-1.5"
              >
                {/* Background Poster Image */}
                {reel.thumbnailUrl && (
                  <Image
                    src={reel.thumbnailUrl}
                    alt={reel.title}
                    fill
                    sizes="(max-width: 640px) 210px, 260px"
                    className={`object-cover transition-opacity duration-300 ${
                      isHovered ? "opacity-0" : "opacity-100"
                    }`}
                  />
                )}

                {/* High-Definition HTML5 Video */}
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(reel._id, el);
                    else videoRefs.current.delete(reel._id);
                  }}
                  src={reel.videoUrl}
                  loop
                  playsInline
                  preload="metadata"
                  className={`absolute inset-0 size-full object-cover transition-opacity duration-300 ${
                    isHovered ? "opacity-100" : "opacity-0"
                  }`}
                />

                {/* Gradient Overlays for Readability */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/35" />

                {/* Top Strip Controls */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold text-white border border-white/20">
                    <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>0:0{reel.duration || 8}s</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMuted(!isMuted);
                    }}
                    aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                    className="grid size-7 place-items-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/75 transition cursor-pointer"
                  >
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>
                </div>

                {/* Center Play Button on Inactive */}
                <div
                  className={`absolute inset-0 grid place-items-center pointer-events-none transition-opacity duration-300 ${
                    isHovered ? "opacity-0" : "opacity-90"
                  }`}
                >
                  <div className="grid size-12 place-items-center rounded-full bg-white/25 backdrop-blur-md text-white border border-white/40 shadow-lg group-hover:scale-110 transition duration-300">
                    <Play size={20} className="fill-white translate-x-0.5" />
                  </div>
                </div>

                {/* Bottom Content Area */}
                <div className="absolute bottom-3 inset-x-3 z-10 space-y-2">
                  {/* Floating Tagged Product Card Pill */}
                  {reel.productTitle && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        if (reel.productSlug) {
                          window.location.href = `/product/${reel.productSlug}`;
                        } else if (reel.productUrl) {
                          window.location.href = reel.productUrl;
                        } else {
                          openReelModal(reel);
                        }
                      }}
                      className="flex items-center gap-2 p-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-white/40 shadow-lg hover:bg-white transition cursor-pointer group/pill"
                    >
                      {reel.productImage ? (
                        <div className="relative size-8 rounded-lg overflow-hidden shrink-0 bg-neutral-100">
                          <Image
                            src={reel.productImage}
                            alt={reel.productTitle}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="size-8 rounded-lg bg-rose-50 text-rose-600 grid place-items-center shrink-0">
                          <ShoppingBag size={14} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0 pr-1">
                        <p className="text-[11px] font-bold text-neutral-900 truncate leading-tight">
                          {reel.productTitle}
                        </p>
                        <p className="text-[10px] font-semibold text-rose-600 leading-tight">
                          ₹{reel.productPrice || 299}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-lg bg-rose-600 px-2 py-1 text-[10px] font-bold text-white shadow-2xs group-hover/pill:bg-rose-700 transition">
                        Shop
                      </span>
                    </div>
                  )}

                  {/* Reel Caption */}
                  <p className="text-xs font-semibold text-white/95 line-clamp-2 leading-snug drop-shadow-sm">
                    {reel.title}
                  </p>

                  {/* Social stats */}
                  <div className="flex items-center justify-between pt-0.5 text-[11px] text-white/80 font-medium">
                    <span className="flex items-center gap-1">
                      <Eye size={12} className="text-white/70" />
                      {(reel.viewsCount || 1200).toLocaleString("en-IN")}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleLike(e, reel)}
                      className="flex items-center gap-1 text-white hover:text-rose-400 transition cursor-pointer"
                    >
                      <Heart
                        size={13}
                        className={
                          isLiked
                            ? "fill-rose-500 text-rose-500 scale-110"
                            : "text-white"
                        }
                      />
                      <span>{(reel.likesCount || 100).toLocaleString("en-IN")}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* FOOTER STRIP */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#ded8cc]/50 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-8 h-px bg-[#bd6f53]" />
            <p className="italic font-medium">
              Tag <span className="font-bold text-rose-700">#GirlyHubStyle</span> to get featured on our feed!
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-neutral-700">
            <span className="flex items-center gap-1 text-emerald-700">
              <Sparkles size={13} />
              <span>100% Real Product Videos</span>
            </span>
            <span className="text-neutral-300">•</span>
            <span>Unfiltered Quality</span>
          </div>
        </div>
      </div>

      {/* FULLSCREEN / REEL VIEWER MODAL */}
      {activeModalReel && (
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActiveModalReel(null)}
        >
          {/* Modal Container */}
          <div
            className="relative w-full max-w-[400px] h-[92vh] max-h-[820px] rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Video Player */}
            <video
              ref={modalVideoRef}
              src={activeModalReel.videoUrl}
              autoPlay
              loop
              playsInline
              className="absolute inset-0 size-full object-cover"
            />

            {/* Gradient Overlays */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />

            {/* Top Toolbar */}
            <div className="relative z-20 flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-full bg-rose-600 text-white font-bold grid place-items-center text-xs shadow-md">
                  G
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">
                    GirlyHub Official
                  </p>
                  <p className="text-[10px] text-white/70">Instagram Reel</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="grid size-8 place-items-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalReel(null)}
                  className="grid size-8 place-items-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-black/80 transition cursor-pointer"
                  title="Close reel"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Navigation Arrows for Previous / Next Reel */}
            <button
              type="button"
              onClick={prevReel}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 grid size-9 place-items-center rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/70 transition cursor-pointer"
              title="Previous reel"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={nextReel}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 grid size-9 place-items-center rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-black/70 transition cursor-pointer"
              title="Next reel"
            >
              <ChevronRight size={20} />
            </button>

            {/* Bottom Panel */}
            <div className="relative z-20 mt-auto p-4 space-y-3">
              {/* Caption */}
              <div>
                <h3 className="text-sm font-bold text-white drop-shadow-md">
                  {activeModalReel.title}
                </h3>
                {activeModalReel.description && (
                  <p className="mt-1 text-xs text-white/80 line-clamp-2 leading-relaxed">
                    {activeModalReel.description}
                  </p>
                )}
              </div>

              {/* Tagged Product Box */}
              {activeModalReel.productTitle && (
                <div className="rounded-2xl bg-white/95 backdrop-blur-md p-3 border border-white/30 shadow-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {activeModalReel.productImage ? (
                      <div className="relative size-12 rounded-xl overflow-hidden shrink-0 bg-neutral-100">
                        <Image
                          src={activeModalReel.productImage}
                          alt={activeModalReel.productTitle}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-12 rounded-xl bg-rose-50 text-rose-600 grid place-items-center shrink-0">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-neutral-900 truncate">
                        {activeModalReel.productTitle}
                      </p>
                      <p className="text-sm font-extrabold text-rose-600">
                        ₹{activeModalReel.productPrice || 299}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={
                      activeModalReel.productSlug
                        ? `/product/${activeModalReel.productSlug}`
                        : activeModalReel.productUrl || "#"
                    }
                    onClick={() => setActiveModalReel(null)}
                    className="shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
                  >
                    View Piece
                  </Link>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={(e) => handleLike(e, activeModalReel)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold hover:bg-white/30 transition cursor-pointer"
                >
                  <Heart
                    size={15}
                    className={
                      likedReelIds.has(activeModalReel._id)
                        ? "fill-rose-500 text-rose-500"
                        : "text-white"
                    }
                  />
                  <span>
                    {(activeModalReel.likesCount || 140).toLocaleString("en-IN")}{" "}
                    Likes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={copyShareLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold hover:bg-white/30 transition cursor-pointer"
                >
                  {copiedShare ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={14} />
                      <span>Share Reel</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}