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

/**
 * Server Component: Trust Strip (zero client JS)
 */
export default function TrustStrip() {
  return (
    <section className="bg-white px-4 py-10 sm:px-6 lg:py-12 rounded-3xl border border-rose-100/60 my-6 relative overflow-hidden shadow-xs">
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

        {/* Desktop Grid */}
        <div className="relative mt-10 hidden sm:block">
          <div className="absolute left-[12%] right-[12%] top-5 h-px bg-gradient-to-r from-[#e8c99a] via-[#b28a50] to-[#e8c99a]" />

          <div className="grid grid-cols-5">
            {features.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex flex-col items-center">
                  <div className="relative">
                    <div className="flex size-12 items-center justify-center rounded-full border border-[#e8759b] bg-[#fcebf1] text-[#c63268] transition-transform duration-300 hover:scale-110">
                      <Icon className="size-5" />
                    </div>

                    {item.badge && (
                      <span className="absolute -top-1 -right-2 text-[8px] px-1.5 py-[1px] rounded-full bg-[#c63268] text-white font-semibold shadow-xs">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-[#5b102d] font-medium text-center">
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile Grid */}
        <div className="relative mt-8 space-y-4 sm:hidden">
          {features.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center rounded-full border border-[#e8759b] bg-[#fcebf1] text-[#c63268] shrink-0">
                  <Icon className="size-4" />
                </div>

                <p className="text-xs font-medium text-[#5b102d]">{item.title}</p>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-xs text-[#8a6b70]">
          Crafted with care — modern design meets timeless elegance.
        </p>
      </div>
    </section>
  );
}
