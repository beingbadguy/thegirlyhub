"use client";
import { useEffect, useRef, useState } from "react";
import {
  BadgeCheck,
  Gem,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

const features = [
  { icon: Sparkles, title: "Trending Styles" },
  { icon: BadgeCheck, title: "Loved by 1K+ Customers", badge: "Real" },
  { icon: ShieldCheck, title: "Skin Friendly" },
  { icon: Gem, title: "Premium Finish" },
  { icon: HeartHandshake, title: "Trusted Support" },
];
export default function TrustStrip() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-white px-4 py-10 sm:px-6 lg:py-12 rounded-3xl border border-rose-100/60 my-6 relative overflow-hidden shadow-xs">
      <div className="pointer-events-none absolute -top-4 -right-4 opacity-30">
        <FloralAccent flower={1} size="md" variant="float" />
      </div>
      <div className="pointer-events-none absolute -bottom-4 -left-4 opacity-30">
        <FloralAccent flower={3} size="md" variant="sway" />
      </div>

      <div className="mx-auto max-w-4xl text-center relative z-10">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#b28a50]">
          Quality
        </p>

        <div className="flex items-center justify-center gap-2">
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80" />
          <h2 className="mt-1 text-2xl font-semibold text-[#5b102d] sm:text-3xl font-serif">
            GirlyHub Promise
          </h2>
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80" />
        </div>

        {/* Desktop */}
        <div className="relative mt-10 hidden sm:block">
          <div
            className="absolute left-[12%] right-[12%] top-5 h-px origin-left bg-gradient-to-r from-[#e8c99a] via-[#b28a50] to-[#e8c99a] transition-transform duration-700"
            style={{
              transform: inView ? "scaleX(1)" : "scaleX(0)",
            }}
          />

          <div className="grid grid-cols-5">
            {features.map((item, i) => (
              <Feature key={i} item={item} i={i} inView={inView} />
            ))}
          </div>
        </div>

        {/* Mobile */}
        <div className="relative mt-8 space-y-5 sm:hidden">
          <div
            className="absolute left-6 top-1 bottom-1 w-px origin-top bg-gradient-to-b from-[#e8c99a] via-[#b28a50] to-[#e8c99a] transition-transform duration-700"
            style={{
              transform: inView ? "scaleY(1)" : "scaleY(0)",
            }}
          />

          {features.map((item, i) => (
            <FeatureMobile key={i} item={item} i={i} inView={inView} />
          ))}
        </div>

        <p className="mt-8 text-xs text-[#8a6b70]">
          Crafted with care — modern design meets timeless elegance.
        </p>
      </div>
    </section>
  );
}

function Feature({ item, i, inView }: any) {
  const Icon = item.icon;

  return (
    <div
      className="flex flex-col items-center transition duration-500"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(8px)",
        transitionDelay: `${i * 80}ms`,
      }}
    >
      <div className="relative">
        <div className="flex size-12 items-center justify-center rounded-full border border-[#e8759b] bg-[#fcebf1] text-[#c63268]">
          <Icon className="size-5" />
        </div>

        {item.badge && (
          <span className="absolute -top-1 -right-2 text-[8px] px-1.5 py-[1px] rounded-full bg-[#c63268] text-white">
            {item.badge}
          </span>
        )}
      </div>

      <p className="mt-2 text-[11px] text-[#5b102d] font-medium text-center">
        {item.title}
      </p>
    </div>
  );
}

function FeatureMobile({ item, i, inView }: any) {
  const Icon = item.icon;

  return (
    <div
      className="flex items-center gap-3 transition duration-500"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateX(0)" : "translateX(-8px)",
        transitionDelay: `${i * 80}ms`,
      }}
    >
      <div className="relative flex size-10 items-center justify-center rounded-full border border-[#e8759b] bg-[#fcebf1] text-[#c63268]">
        <Icon className="size-4" />
      </div>

      <p className="text-xs font-medium text-[#5b102d]">{item.title}</p>
    </div>
  );
}
