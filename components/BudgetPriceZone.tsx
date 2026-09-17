"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Tag, Flame, Crown, Gem } from "lucide-react";
import { motion } from "framer-motion";

interface PriceTier {
  id: string;
  price: number;
  badge: string;
  badgeIcon: React.ElementType;
  title: string;
  description: string;
  tagline: string;
  href: string;
  gradient: string;
  glowColor: string;
  pillBg: string;
  popular?: boolean;
}

const PRICE_TIERS: PriceTier[] = [
  {
    id: "under-99",
    price: 99,
    badge: "Pocket Friendly",
    badgeIcon: Tag,
    title: "Under ₹99",
    description: "Hair pins, mini claw clips, safety studs & cute everyday essentials",
    tagline: "Starting from ₹29",
    href: "/product?maxPrice=99",
    gradient: "from-[#ff6b8b] via-[#ff758c] to-[#ff7eb3]",
    glowColor: "rgba(255, 107, 139, 0.28)",
    pillBg: "bg-white/25 text-white border-white/30",
  },
  {
    id: "under-199",
    price: 199,
    badge: " Loved & Trending",
    badgeIcon: Flame,
    title: "Under ₹199",
    description: "Korean stud earrings, silk scrunchies, pearl hoops & pastel clips",
    tagline: "Top Best-Sellers",
    href: "/product?maxPrice=199",
    gradient: "from-[#f43f5e] via-[#e11d48] to-[#be123c]",
    glowColor: "rgba(225, 29, 72, 0.35)",
    pillBg: "bg-white/30 text-white border-white/40",
    popular: true,
  },
  {
    id: "under-299",
    price: 299,
    badge: "Luxe & Statement",
    badgeIcon: Crown,
    title: "Under ₹299",
    description: "Gold-plated jewellery, anti-tarnish rings, jumbo claws & chic sets",
    tagline: "Luxury look for less",
    href: "/product?maxPrice=299",
    gradient: "from-[#e65c87] via-[#d6336c] to-[#9c1248]",
    glowColor: "rgba(214, 51, 108, 0.3)",
    pillBg: "bg-white/25 text-white border-white/30",
  },
  {
    id: "under-499",
    price: 499,
    badge: "Combo Sets & Gifts",
    badgeIcon: Gem,
    title: "Under ₹499",
    description: "Gift hampers, matching necklace sets, premium hair accessories & more",
    tagline: "Maximum value deals",
    href: "/product?maxPrice=499",
    gradient: "from-[#b83280] via-[#97266d] to-[#701a75]",
    glowColor: "rgba(184, 50, 128, 0.3)",
    pillBg: "bg-white/25 text-white border-white/30",
  },
];

export default function BudgetPriceZone() {
  return (
    <section className="mx-auto my-8 max-w-7xl px-2 sm:my-12 md:my-14">
      {/* Section Header */}
      <div className="mb-6 flex flex-col items-center text-center sm:mb-9">
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-rose-200/80 bg-rose-50/80 px-3.5 py-1 text-xs font-semibold tracking-wide text-rose-600 shadow-2xs">
          <Sparkles className="size-3.5 text-rose-500" />
          <span>BUDGET BOUTIQUE</span>
        </div>

        <h2 className="font-serif text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl md:text-4xl">
          Shop By Budget <span aria-hidden="true">✨</span>
        </h2>

        <p className="mt-2 max-w-lg text-xs leading-relaxed text-neutral-500 sm:text-sm">
          Big style at pocket-friendly prices. Tap any price zone to explore curated finds under your budget.
        </p>
      </div>

      {/* Grid of Price Tiers */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PRICE_TIERS.map((tier) => {
          const BadgeIcon = tier.badgeIcon;
          return (
            <Link
              key={tier.id}
              href={tier.href}
              className="group relative block focus:outline-none"
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className={`relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-3xl bg-gradient-to-br ${tier.gradient} p-6 text-white shadow-lg transition-all duration-300 sm:min-h-[280px] sm:p-7`}
                style={{
                  boxShadow: `0 14px 30px -10px ${tier.glowColor}`,
                }}
              >
                {/* Decorative background glass shapes */}
                <div className="pointer-events-none absolute -right-6 -top-6 size-32 rounded-full bg-white/15 blur-xl transition-transform duration-500 group-hover:scale-125" />
                <div className="pointer-events-none absolute -bottom-10 -left-6 size-28 rounded-full bg-black/10 blur-lg" />
                <div className="pointer-events-none absolute right-4 bottom-8 text-7xl font-black text-white/[0.07] select-none font-sans">
                  ₹{tier.price}
                </div>

                {/* Top Row: Badge & Popular Pill */}
                <div className="relative z-10">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold backdrop-blur-md ${tier.pillBg}`}
                    >
                      <BadgeIcon className="size-3" />
                      {tier.badge}
                    </span>

                    {tier.popular && (
                      <span className="rounded-full bg-amber-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-950 shadow-xs animate-pulse">
                        HOT 🔥
                      </span>
                    )}
                  </div>

                  {/* Main Price Heading */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                      Everything
                    </p>
                    <h3 className="font-serif text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                      {tier.title}
                    </h3>
                  </div>

                  {/* Subtitle / Description */}
                  <p className="mt-2 text-xs leading-relaxed text-white/85 line-clamp-2 sm:text-[13px]">
                    {tier.description}
                  </p>
                </div>

                {/* Bottom Row: Tagline + Action Button */}
                <div className="relative z-10 mt-6 pt-4 border-t border-white/20 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-white/90">
                    {tier.tagline}
                  </span>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-900 shadow-md transition-all duration-300 group-hover:bg-neutral-900 group-hover:text-white group-hover:shadow-lg">
                    <span>Shop Now</span>
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
