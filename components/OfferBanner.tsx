"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import FloralAccent from "@/components/decorations/FloralAccent";

const OFFER_DURATION = 7 * 24 * 60 * 60 * 1000;

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const getTimeLeft = (endTime: number): TimeLeft => {
  const remaining = Math.max(0, endTime - Date.now());
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60),
  };
};

const pad = (value: number) => String(value).padStart(2, "0");

export default function OfferBanner() {
  const reduceMotion = useReducedMotion();
  const [endTime, setEndTime] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const storageKey = "girlyhub-offer-end-time";
    const storedEndTime = window.localStorage.getItem(storageKey);
    const parsedEndTime = storedEndTime ? Number(storedEndTime) : 0;
    const nextEndTime =
      parsedEndTime > Date.now() ? parsedEndTime : Date.now() + OFFER_DURATION;

    window.localStorage.setItem(storageKey, String(nextEndTime));
    setEndTime(nextEndTime);
    setTimeLeft(getTimeLeft(nextEndTime));
  }, []);

  useEffect(() => {
    if (!endTime) return;

    const timer = window.setInterval(() => {
      setTimeLeft(getTimeLeft(endTime));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [endTime]);

  const units = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Minutes" },
    { value: timeLeft.seconds, label: "Seconds" },
  ];

  return (
    <motion.section
      aria-labelledby="offer-heading"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10%" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto my-8 w-full max-w-7xl overflow-hidden rounded-3xl sm:rounded-4xl bg-gradient-to-br from-[#f4729b] via-[#e5527f] to-[#cf3366] px-5 py-8 sm:px-8 sm:py-10 md:px-12 md:py-11 text-white shadow-[0_20px_50px_rgba(207,51,102,0.22)]"
    >
      {/* Background ambient lighting circles */}
      <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full border border-white/20 bg-white/5 blur-xs" />
      <div className="pointer-events-none absolute -bottom-28 left-1/4 size-72 rounded-full border border-white/15 bg-white/5 blur-xs" />

      {/* Decorative Floral Accents */}
      <div className="pointer-events-none absolute top-2 right-4 opacity-35 sm:opacity-45 z-0 select-none">
        <FloralAccent flower={2} size="lg" animation="float" className="rotate-12 scale-90 sm:scale-100" />
      </div>
      <div className="pointer-events-none absolute -bottom-5 -left-3 opacity-30 sm:opacity-40 z-0 select-none">
        <FloralAccent flower={1} size="lg" animation="sway" className="scale-90 sm:scale-100" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-between gap-6 md:flex-row md:gap-8 lg:gap-12">
        {/* Left: Heading & Promo Text */}
        <div className="text-center md:text-left max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wider text-white backdrop-blur-md border border-white/20 mb-3 shadow-xs">
            <Sparkles className="size-3 text-amber-200" />
            <span>FLASH OFFER • LIMITED TIME</span>
          </div>
          <h2
            id="offer-heading"
            className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight drop-shadow-xs"
          >
            Offer miss mat kar yaar <span aria-hidden="true">💖</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-white/90 leading-relaxed">
            Grab your favorite aesthetic hair claws & jewellery before the clock runs out!
          </p>
        </div>

        {/* Center: Premium Glassmorphic Countdown Timer */}
        <div
          className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0"
          aria-label="Offer countdown"
        >
          {units.map((unit, index) => (
            <div key={unit.label} className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3">
              <div className="flex flex-col items-center">
                {/* Frosted Glass Card */}
                <div className="relative flex h-14 w-14 sm:h-18 sm:w-18 md:h-20 md:w-20 items-center justify-center rounded-2xl border border-white/35 bg-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.45)] backdrop-blur-md transition-transform duration-200 hover:scale-105">
                  {/* Subtle top gloss sheen */}
                  <div className="pointer-events-none absolute inset-x-2 top-1 h-[35%] rounded-t-xl bg-gradient-to-b from-white/30 to-transparent" />
                  <span className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white drop-shadow-sm tabular-nums">
                    {pad(unit.value)}
                  </span>
                </div>
                {/* Unit Label */}
                <span className="mt-1.5 text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-white/95 drop-shadow-xs">
                  {unit.label}
                </span>
              </div>

              {/* Glowing Colon Separator (except after the last item) */}
              {index < units.length - 1 && (
                <div className="flex flex-col items-center justify-center gap-1 -mt-4 text-white/80 font-bold text-lg sm:text-xl">
                  <span className="size-1 sm:size-1.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                  <span className="size-1 sm:size-1.5 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right: CTA Button */}
        <Link
          href="/product"
          className="shrink-0"
        >
          <motion.span
            whileHover={
              reduceMotion
                ? undefined
                : {
                    scale: 1.05,
                    boxShadow: "0 14px 28px rgba(126, 34, 61, 0.28)",
                  }
            }
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
            className="inline-flex items-center gap-2.5 rounded-full bg-[#ffe7a8] px-7 py-3.5 text-sm font-bold text-[#7c3f4e] shadow-[0_10px_22px_rgba(126,34,61,0.18)] transition-all duration-200 hover:bg-[#fff0c7] active:scale-95"
          >
            <span>Shop Now</span>
            <ArrowRight className="size-4 stroke-[2.5]" />
          </motion.span>
        </Link>
      </div>
    </motion.section>
  );
}
