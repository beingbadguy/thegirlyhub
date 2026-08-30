"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Banner = {
  _id: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image: string;
  link?: string;
  buttonText?: string;
};

export default function HeroBannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    fetch("/api/banner")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!mounted || !data?.banners?.length) return;
        setBanners(data.banners);
        setActiveIndex(0);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const banner = banners[activeIndex];

  return (
    <section>
      <div className="relative mt-1 mb-3 w-full overflow-hidden rounded-xl">
        {/* LOADING */}
        {!banner ? (
          <div className="w-full h-[200px] md:h-[300px] animate-pulse  rounded-xl" />
        ) : (
          <div className="relative w-full h-[180px] sm:h-[220px] md:h-[280px] lg:h-[320px]">
            {/* IMAGE - NO CROPPING */}
            <Image
              fill
              src={banner.image}
              alt="banner"
              className="object-contain rounded-xl"
            />

            {/* TEXT OVERLAY */}
            {(banner.title || banner.subtitle || banner.description) && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 sm:p-6 text-white">
                <div className="max-w-xl">
                  {banner.subtitle && (
                    <p className="text-xs uppercase tracking-widest text-white/80 mb-1">
                      {banner.subtitle}
                    </p>
                  )}

                  {banner.title && (
                    <h1 className="text-xl sm:text-3xl font-bold">
                      {banner.title}
                    </h1>
                  )}

                  {banner.description && (
                    <p className="mt-1 text-sm sm:text-base text-white/90">
                      {banner.description}
                    </p>
                  )}

                  {banner.link && banner.buttonText && (
                    <Link
                      href={banner.link}
                      className="inline-block mt-3 bg-white text-black px-4 py-2 text-sm font-semibold rounded hover:bg-gray-200"
                    >
                      {banner.buttonText}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DOTS */}
      {banners.length > 1 && (
        <div className="flex justify-center items-center gap-1.5 h-8">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === activeIndex
                  ? "w-7 bg-[#33272d]"
                  : "w-1.5 bg-[#d9cbd1]"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
