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
                Promo slot
              </p>
              <h3 className="font-serif text-xl font-medium text-rose-950 md:text-2xl">
                First order? Enjoy 15% off
              </h3>
              <p className="mt-1 max-w-md text-sm text-rose-900/60">
                Placeholder for seasonal offers, flash sales, or coupon campaigns.
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
      <div
        data-ad-slot="home-mid-banner"
        className="grid min-h-[140px] place-items-center rounded-2xl border-2 border-dashed border-rose-200/80 bg-rose-50/50 px-6 py-10 text-center"
      >
        {/* <div>
          <Megaphone className="mx-auto mb-2 size-6 text-rose-300" />
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-rose-400">
            Ad / campaign banner
          </p>
          <p className="mt-1 text-sm text-rose-900/50">
            728×90 or full-width image / video — drop creative here later
          </p>
        </div> */}
      </div>
      <Image src="/ad1.png" alt="ads" fill />

      {/* Slot 3 — Two-column conversion cards */}
      <div className="grid gap-5 md:grid-cols-2">
        <div
          data-ad-slot="home-conversion-left"
          className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
        >
          <Sparkles className="mb-3 size-5 text-amber-400" />
          <h3 className="font-serif text-lg font-medium text-rose-950">
            New collection drop
          </h3>
          <p className="mt-2 text-sm text-rose-900/60">
            Use for category highlights, influencer picks, or gift guides.
          </p>
          <Link
            href="/newarrivals"
            className="mt-4 inline-block text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            View new arrivals →
          </Link>
        </div>

        <div
          data-ad-slot="home-conversion-right"
          className="rounded-2xl border border-rose-100 bg-white p-6 shadow-sm"
        >
          <Sparkles className="mb-3 size-5 text-rose-400" />
          <h3 className="font-serif text-lg font-medium text-rose-950">
            Join our newsletter
          </h3>
          <p className="mt-2 text-sm text-rose-900/60">
            Conversion slot for email capture, app download, or loyalty program.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block text-sm font-semibold text-rose-600 hover:text-rose-700"
          >
            Get in touch →
          </Link>
        </div>
      </div>
    </section>
  );
}
