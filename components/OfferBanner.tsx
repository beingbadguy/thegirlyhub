"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

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
    [timeLeft.days, "Days"],
    [timeLeft.hours, "Hours"],
    [timeLeft.minutes, "Minutes"],
    [timeLeft.seconds, "Seconds"],
  ] as const;

  return (
    <motion.section
      aria-labelledby="offer-heading"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10%" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto my-8 w-full max-w-7xl overflow-hidden rounded-4xl bg-linear-to-br from-[#f8b8c9] via-[#e991ae] to-[#cf5e85] px-6 py-9 text-white shadow-[0_18px_50px_rgba(190,24,93,0.16)] sm:px-10 md:my-12 md:px-14 md:py-12"
    >
      <div className="pointer-events-none absolute -right-10 -top-20 size-64 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full border border-white/10" />

      <div className="relative grid items-center gap-8 md:grid-cols-[1fr_auto_auto] md:gap-12 lg:gap-20">
        <div>
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] text-white/80">
            <Sparkles className="size-3.5" />
            JUST FOR YOU
          </p>
          <h2
            id="offer-heading"
            className="whitespace-nowrap font-serif text-[clamp(1.35rem,4.8vw,2.75rem)] leading-tight"
          >
            Offer miss mat kar yaar <span aria-hidden="true">💖</span>
          </h2>
          <p className="mt-3 text-sm text-white/80 sm:text-base">
            Limited time deal chal rahi hai
          </p>
        </div>

        <div
          className="grid grid-cols-4 gap-2 sm:gap-3"
          aria-label="Offer countdown"
        >
          {units.map(([value, label]) => (
            <div key={label} className="min-w-0 text-center">
              <div className="flex size-[3.6rem] items-center justify-center rounded-2xl border border-white/25 bg-white/15 px-1 text-xl font-semibold tabular-nums backdrop-blur-sm sm:size-18 sm:text-2xl">
                {pad(value)}
              </div>
              <span className="mt-2 block text-[9px] font-medium uppercase tracking-[0.14em] text-white/75 sm:text-[10px]">
                {label}
              </span>
            </div>
          ))}
        </div>

        <Link
          href="/product"
          className="justify-self-start md:justify-self-end"
        >
          <motion.span
            whileHover={
              reduceMotion
                ? undefined
                : {
                    scale: 1.04,
                    boxShadow: "0 12px 24px rgba(126, 34, 61, 0.2)",
                  }
            }
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="inline-flex items-center gap-3 rounded-full bg-[#ffe7a8] px-6 py-3.5 text-sm font-semibold text-[#7c3f4e] shadow-[0_8px_18px_rgba(126,34,61,0.12)] transition-colors hover:bg-[#fff0c7]"
          >
            Shop Now
            <ArrowRight className="size-4" />
          </motion.span>
        </Link>
      </div>
    </motion.section>
  );
}
