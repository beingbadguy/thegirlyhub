import {
  BadgeCheck,
  Gem,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import FloralAccent from "@/components/decorations/FloralAccent";

const features = [
  { icon: Sparkles, title: "Trending Korean Styles", subtitle: "Curated weekly" },
  { icon: BadgeCheck, title: "Loved by 50K+ Girls", subtitle: "Real verified lovers", badge: "Real" },
  { icon: ShieldCheck, title: "Skin & Hair Friendly", subtitle: "Hypoallergenic alloys" },
  { icon: Gem, title: "Premium Finish", subtitle: "Tarnish-resistant shine" },
  { icon: HeartHandshake, title: "Pan-India COD & Care", subtitle: "Fast & dedicated support" },
];

/**
 * Server Component: Trust Strip (zero client JS)
 */
export default function TrustStrip() {
  return (
    <section className="bg-gradient-to-b from-white via-[#fffdfc] to-[#fff9f9] px-4 py-10 sm:px-6 lg:py-14 rounded-3xl sm:rounded-4xl border border-[#eddcd0]/80 my-8 sm:my-12 relative overflow-hidden shadow-[0_8px_30px_-10px_rgba(78,26,39,0.05)]">
      <div className="pointer-events-none absolute -top-6 -right-6 opacity-25">
        <FloralAccent flower={1} size="lg" variant="float" />
      </div>
      <div className="pointer-events-none absolute -bottom-6 -left-6 opacity-25">
        <FloralAccent flower={3} size="lg" variant="sway" />
      </div>

      <div className="mx-auto max-w-5xl text-center relative z-10">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-rose-50/70 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a3348] mb-2 shadow-2xs">
          <Sparkles className="size-3 text-pink-500" />
          <span>The GirlyHub Standard</span>
        </div>

        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80 hidden sm:inline-block" />
          <h2 className="mt-1 text-2xl sm:text-3xl md:text-4xl font-normal text-[#4e1a27] font-cormorant tracking-[0.01em]">
            Crafted for Comfort, Designed to Sparkle
          </h2>
          <FloralAccent flower={1} size="xs" variant="pulse" className="opacity-80 hidden sm:inline-block rotate-45" />
        </div>

        <p className="mt-2 text-xs sm:text-sm text-gray-500 max-w-lg mx-auto font-sans">
          Every accessory is hand-checked for snag-free hair comfort and sensitive-skin durability.
        </p>

        {/* Desktop Grid */}
        <div className="relative mt-10 sm:mt-12 hidden sm:block">
          <div className="absolute left-[10%] right-[10%] top-6 h-px bg-gradient-to-r from-transparent via-[#d8b5a0] to-transparent" />

          <div className="grid grid-cols-5 gap-3">
            {features.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex flex-col items-center group">
                  <div className="relative">
                    <div className="flex size-13 items-center justify-center rounded-2xl border border-rose-200/80 bg-white text-[#8a2a44] shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:border-rose-300 group-hover:shadow-md">
                      <Icon className="size-5.5 text-[#8a2a44]" />
                    </div>

                    {item.badge && (
                      <span className="absolute -top-1.5 -right-2 text-[8px] px-1.5 py-[1px] rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white font-bold shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-xs text-[#4e1a27] font-semibold text-center leading-snug">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#8a6b70] text-center font-normal">
                    {item.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Grid */}
        <div className="relative mt-8 space-y-3.5 sm:hidden text-left">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3.5 bg-white/70 border border-rose-100/70 rounded-2xl p-3 shadow-2xs">
                <div className="relative flex size-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-[#8a2a44] shrink-0">
                  <Icon className="size-4.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#4e1a27]">{item.title}</p>
                  <p className="text-[11px] text-gray-500">{item.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-[11px] sm:text-xs text-[#8a6b70]">
          Modern Korean elegance meets honest Indian pricing — shop with 100% confidence.
        </p>
      </div>
    </section>
  );
}
