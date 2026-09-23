"use client";

import { cachedApiGet } from "@/lib/apiCache";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type Banner = {
  _id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image: string;
  mobileImage?: string;
  tabletImage?: string;
  link?: string;
  buttonText?: string;
};

interface HeroBannerSliderProps {
  initialBanners?: Banner[];
}

export default function HeroBannerSlider({
  initialBanners,
}: HeroBannerSliderProps) {
  const hasInitial =
    Array.isArray(initialBanners) && initialBanners.length > 0;
  const [banners, setBanners] = useState<Banner[]>(
    hasInitial ? initialBanners : [],
  );
  const [activeIndex, setActiveIndex] = useState(0);

  // Swipe gesture refs
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);
  const hasSwipedRef = useRef(false);

  useEffect(() => {
    if (hasInitial) return;

    let mounted = true;
    cachedApiGet<{ banners?: Banner[] }>(
      "/api/banner",
      undefined,
      { ttlMs: 10 * 60 * 1000 },
    )
      .then((data) => {
        if (!mounted || !data?.banners?.length) return;
        setBanners(data.banners);
        setActiveIndex(0);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [hasInitial]);

  const handleNext = useCallback(() => {
    if (banners.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const handlePrev = useCallback(() => {
    if (banners.length <= 1) return;
    setActiveIndex((prev) => (prev <= 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  // Auto-advance slider
  useEffect(() => {
    if (banners.length < 2) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [banners.length, activeIndex, handleNext]);

  // Touch swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
    hasSwipedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    ) {
      return;
    }

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;

    // Check if horizontal swipe dominates vertical scrolling
    if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
      hasSwipedRef.current = true;
      if (diffX > 0) {
        // Swiped left -> next slide
        handleNext();
      } else {
        // Swiped right -> previous slide
        handlePrev();
      }

      setTimeout(() => {
        hasSwipedRef.current = false;
      }, 300);
    }

    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
  };

  const banner = banners[activeIndex];

  return (
    <section className="relative w-full overflow-hidden bg-white group">
      <div
        className="relative w-full select-none touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={() => {
          touchStartX.current = null;
          touchEndX.current = null;
          touchStartY.current = null;
          touchEndY.current = null;
        }}
      >
        {!banner ? (
          /* Exact same dimensions to prevent any Cumulative Layout Shift (CLS = 0) */
          <div className="w-full h-[280px] sm:h-[340px] md:h-[400px] lg:h-[460px] animate-pulse bg-neutral-100" />
        ) : (
          <div className="relative w-full h-[280px] sm:h-[340px] md:h-[400px] lg:h-[460px]">
            {/* MOBILE (< 640px) */}
            <div className="block sm:hidden absolute inset-0">
              <Image
                src={banner.mobileImage || banner.image}
                alt={banner.title || "GirlyHub Hero Banner Mobile"}
                fill
                priority={activeIndex === 0}
                quality={85}
                sizes="100vw"
                draggable={false}
                className="object-cover object-center pointer-events-none"
              />
            </div>

            {/* TABLET (640px to 1024px) */}
            <div className="hidden sm:block lg:hidden absolute inset-0">
              <Image
                src={banner.tabletImage || banner.image}
                alt={banner.title || "GirlyHub Hero Banner Tablet"}
                fill
                priority={activeIndex === 0}
                quality={85}
                sizes="100vw"
                draggable={false}
                className="object-cover object-center pointer-events-none"
              />
            </div>

            {/* DESKTOP (>= 1024px) */}
            <div className="hidden lg:block absolute inset-0">
              <Image
                src={banner.image}
                alt={banner.title || "GirlyHub Hero Banner Desktop"}
                fill
                priority={activeIndex === 0}
                quality={85}
                sizes="100vw"
                draggable={false}
                className="object-cover object-center pointer-events-none"
              />
            </div>

            {/* Content Overlay */}
            {(banner.title || banner.subtitle || banner.description) && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 sm:p-6 text-white pointer-events-none">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6 pointer-events-auto">
                  <div className="max-w-xl">
                    {banner.subtitle && (
                      <p className="text-xs uppercase tracking-widest text-white/85 mb-1 font-medium">
                        {banner.subtitle}
                      </p>
                    )}

                    {banner.title && (
                      <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                        {banner.title}
                      </h1>
                    )}

                    {banner.description && (
                      <p className="mt-1 text-sm sm:text-base text-white/90 line-clamp-2">
                        {banner.description}
                      </p>
                    )}

                    {banner.link && banner.buttonText && (
                      <Link
                        href={banner.link}
                        onClick={(e) => {
                          if (hasSwipedRef.current) e.preventDefault();
                        }}
                        className="inline-block mt-3 bg-white text-neutral-900 font-semibold px-5 py-2.5 text-xs sm:text-sm uppercase tracking-wider rounded-full hover:bg-neutral-100 transition-all duration-200 shadow-md"
                      >
                        {banner.buttonText}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Arrows for Tablet/Desktop hover */}
      {banners.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-neutral-800 shadow-md backdrop-blur-xs transition hover:bg-white hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 hidden sm:flex cursor-pointer"
          >
            <ChevronLeft className="size-5 -ml-0.5" />
          </button>

          <button
            type="button"
            aria-label="Next slide"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-neutral-800 shadow-md backdrop-blur-xs transition hover:bg-white hover:scale-105 active:scale-95 opacity-0 group-hover:opacity-100 hidden sm:flex cursor-pointer"
          >
            <ChevronRight className="size-5 -mr-0.5" />
          </button>
        </>
      )}

      {/* Navigation Indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 h-7 mt-1 bg-white">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to slide ${index + 1}`}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === activeIndex
                  ? "w-6 bg-rose-700"
                  : "w-1.5 bg-neutral-300 hover:bg-neutral-400"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
