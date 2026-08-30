"use client";

import { Megaphone, Sparkles, Tag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/**
 * Reserved home-page slots for ads, promos, and conversion CTAs.
 * Replace placeholder content with real banners/campaigns when ready.
 */
export default function HomeAdSlots() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 py-6 md:py-10">
      {/* Slot 1 — Hero-adjacent promo strip */}
      <div
        data-ad-slot="home-promo-strip"
        className="relative overflow-hidden rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 via-white to-amber-50 px-6 py-8 md:px-10"
      >
        <div className="absolute -right-6 -top-6 size-32 rounded-full bg-rose-200/40 blur-2xl" />

        <div className="relative flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid size-11 place-items-center rounded-full bg-rose-100 text-rose-600">
              <Tag className="size-5" />
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400">
                Limited Offer
              </p>

              <h3 className="font-serif text-xl font-medium text-rose-950 md:text-2xl">
                Get 15% OFF on your first order 🎉
              </h3>

              <p className="mt-1 max-w-md text-sm text-rose-900/60">
                Use code{" "}
                <span className="font-semibold text-rose-700">NEWGIRLY15</span>{" "}
                at checkout and save instantly.
              </p>
            </div>
          </div>

          <Link
            href="/product"
            className="shrink-0 rounded-full bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
          >
            Shop now
          </Link>
        </div>
      </div>

      {/* Slot 2 — Mid-page conversion banner (full width) */}
      {/* <div
        data-ad-slot="home-mid-banner"
        className="grid min-h-[140px] place-items-center rounded-2xl border-2 border-dashed border-rose-200/80 bg-rose-50/50 px-6 py-10 text-center"
      >
        <div>
          <Megaphone className="mx-auto mb-2 size-6 text-rose-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-400">
            Ad / campaign banner
          </p>
          <p className="mt-1 text-sm text-rose-900/50">
            728×90 or full-width image / video — drop creative here later
          </p>
        </div>
      </div> */}
      {/* <div className="wx  -full">
        <div className="relative w-full h-[250px] md:h-[350px] lg:h-[400px]">
          <Image
            src="/ad1.png"
            alt="banner"
            fill
            priority
            className="object-contain object-center"
          />
        </div>
      </div> */}

      {/* <div className="w-full ">
        <div className="relative  w-full aspect-[16/5] bg-white">
          <Image
            src="/ad1.png"
            alt="banner"
            fill
            priority
            className="object-contain object-center rounded-xl"
          />
        </div>
      </div> */}

      {/* Slot 3 — Two image banners */}
      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/category/For%20him">
          <div className="relative w-full h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] overflow-hidden rounded-2xl border border-teal-400 bg-white  cursor-pointer hover:bg-teal-50 hover:shadow-sm transition-all hover:shadow-teal-200/50">
            <Image
              src="/forhim.png"
              alt="For Him"
              fill
              className="object-cover p-2 rounded-2xl"
            />
          </div>
        </Link>

        <Link href="/category/For%20her">
          <div className="relative w-full h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] overflow-hidden rounded-2xl border border-pink-400 bg-white  cursor-pointer hover:bg-pink-50 hover:shadow-sm transition-all hover:shadow-pink-200/50 ">
            <Image
              src="/forher.png"
              alt="For Her"
              fill
              className="object-cover p-2 rounded-2xl"
            />
          </div>
        </Link>
      </div>
    </section>
  );
}
