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
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!mounted || !data?.banners?.length) return;
        setBanners(data.banners);
        setActiveIndex(0);
      })
      .catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  const banner = banners[activeIndex];

  return (
    <section className="">
      <div className="relative mb-2 mt-4 overflow-hidden rounded-xl shadow-sm">
        {!banner ? (
          <div
            aria-label="Loading featured offers"
            className="aspect-[16/7] min-h-[220px] w-full animate-pulse bg-gray-200 sm:min-h-[300px]"
          />
        ) : (
          <div className="relative aspect-[16/7] min-h-[220px] w-full sm:min-h-[300px]">
            <Image
              key={banner._id}
              src={banner.image}
              alt={banner.title || "Featured offer"}
              fill
              priority={activeIndex === 0}
              sizes="100vw"
              className="object-cover"
            />
            {(banner.title || banner.subtitle || banner.description) && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/65 via-black/10 to-transparent p-5 text-white sm:p-8">
                <div className="max-w-xl">
                  {banner.subtitle && (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.title && (
                    <h1 className="text-2xl font-bold sm:text-4xl">
                      {banner.title}
                    </h1>
                  )}
                  {banner.description && (
                    <p className="mt-2 max-w-lg text-sm text-white/90 sm:text-base">
                      {banner.description}
                    </p>
                  )}
                  {banner.link && banner.buttonText && (
                    <Link
                      href={banner.link}
                      className="mt-4 inline-flex rounded bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
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

      {banners.length > 1 && (
        <>
          {/* <button
            type="button"
            aria-label="Previous banner"
            onClick={previous}
            className="absolute left-6 top-[calc(50%)] -translate-y-1/2 rounded-full bg-white/85 p-2 text-gray-900 shadow hover:bg-white"
          >
            <ChevronLeft className="size-5" />
          </button> */}
          {/* <button
            type="button"
            aria-label="Next banner"
            onClick={next}
            className="absolute right-6 top-[calc(50%)] -translate-y-1/2 rounded-full bg-white/85 p-2 text-gray-900 shadow hover:bg-white"
          >
            <ChevronRight className="size-5" />
          </button> */}
          <div className="flex  h-10 items-center justify-center gap-1.5  ">
            {banners.map((item, index) => (
              <button
                key={item._id}
                type="button"
                aria-label={`Show banner ${index + 1}`}
                onClick={() => setActiveIndex(index)}
                className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-7 bg-[#33272d]" : "w-1.5 bg-[#d9cbd1]"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
