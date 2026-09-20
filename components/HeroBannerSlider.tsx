"use client";

import { cachedApiGet } from "@/lib/apiCache";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    if (banners.length < 2) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const banner = banners[activeIndex];

  return (
    <section className="relative w-full overflow-hidden bg-neutral-100">
      <div className="relative w-full">
        {!banner ? (
          /* Exact same dimensions to prevent any Cumulative Layout Shift (CLS = 0) */
          <div className="w-full h-[280px] sm:h-[340px] md:h-[400px] lg:h-[460px] animate-pulse bg-neutral-200" />
        ) : (
          <div className="relative w-full h-[280px] sm:h-[340px] md:h-[400px] lg:h-[460px]">
            {/* Optimized Hero LCP Image */}
            <Image
              src={banner.image}
              alt={banner.title || "GirlyHub Hero Banner"}
              fill
              priority
              quality={80}
              sizes="100vw"
              className="object-cover object-center"
            />

            {/* Content Overlay */}
            {(banner.title || banner.subtitle || banner.description) && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 sm:p-6 text-white">
                <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
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

      {/* Navigation Indicators */}
      {banners.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 h-7 mt-1">
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
